import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import User from "@/app/models/User";
import Building from "@/app/models/Building";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getLineClient } from "@/lib/line";

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { month } = await request.json();

    if (!month) {
      return NextResponse.json({ error: "Month is required" }, { status: 400 });
    }

    // Get current date in UTC to match how we store dates
    const now = new Date();
    now.setUTCHours(17, 0, 0, 0); // Set to 17:00 UTC (midnight Bangkok time)

    // Find all bills that are past due and don't have a late payment fee
    const overdueBills = await Bill.find({
      month,
      paymentStatus: "pending",
      createdBy: session?.user?.id,
      dueDate: { $lt: now }, // Compare with current UTC date
      additionalFees: {
        $not: {
          $elemMatch: { name: "Late Payment" },
        },
      },
    })
      .populate("buildingId", "billingConfig.latePaymentCharge")
      .populate({
        path: "roomId",
        populate: {
          path: "tenant",
          select: "lineUserId",
        },
      });

    console.log(
      `Found ${overdueBills.length} overdue bills for ${month} without late payment fee`
    );

    // Add late payment fee to each bill
    const updates = await Promise.all(
      overdueBills.map(async (bill) => {
        // Get late payment charge from building config, default to 500 if not set
        const latePaymentCharge =
          bill.buildingId?.billingConfig?.latePaymentCharge || 500;

        // Add late payment fee
        const updatedFees = [
          ...(bill.additionalFees || []),
          {
            name: "Late Payment",
            price: latePaymentCharge,
          },
        ];

        // Calculate new total
        const waterAmount = bill.waterAmount || 0;
        const electricityAmount = bill.electricityAmount || 0;
        const additionalFeesTotal = updatedFees.reduce(
          (sum, fee) => sum + (Number(fee.price) || 0),
          0
        );
        const totalAmount =
          bill.rentAmount +
          waterAmount +
          electricityAmount +
          additionalFeesTotal;

        // Update the bill
        const updatedBill = await Bill.findByIdAndUpdate(
          bill._id,
          {
            $set: {
              additionalFees: updatedFees,
              totalAmount,
            },
          },
          { new: true }
        );

        return updatedBill;
      })
    );

    // Send Line notification
    const message = {
      type: "flex",
      altText: "Overdue Payment Notice",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "⚠️ Overdue Payment Notice",
              weight: "bold",
              size: "lg",
              color: "#898F63",
              wrap: true,
            },
            {
              type: "text",
              text: `Your payment for ${month} is overdue. A late payment fee has been added to your bill.`,
              margin: "md",
              wrap: true,
              size: "sm",
            },
          ],
        },
      },
    };

    // Send notification to each tenant with overdue bill
    for (const bill of overdueBills) {
      const lineUserId = bill.roomId?.tenant?.lineUserId;
      if (lineUserId) {
        const client = await getLineClient(session.user.id); // using landlord's ID from session
        await client.pushMessage(lineUserId, message);
      }
    }

    return NextResponse.json({
      message: `Added late payment fees to ${updates.length} bills for ${month}`,
      updatedBills: updates,
    });
  } catch (error) {
    console.error("Error processing overdue bills:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process overdue bills" },
      { status: 500 }
    );
  }
}
