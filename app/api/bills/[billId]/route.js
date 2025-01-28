import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import { parse } from "url";
import Building from "@/app/models/Building";

export async function GET(request) {
  try {
    await dbConnect();

    const { pathname } = parse(request.url);
    const billId = pathname.split("/").pop(); // Extract billId from the URL

    const bill = await Bill.findById(billId)
      .populate({
        path: "roomId",
        select: "roomNumber floor",
        populate: {
          path: "floor",
          select: "building",
          populate: {
            path: "building",
            select: "name waterRate electricityRate",
          },
        },
      })
      .populate("tenantId", "firstName lastName");

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    return NextResponse.json(
      { error: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    await dbConnect();
    const updates = await request.json();

    // Await the params from the context
    const { billId } = await context.params;

    // Fetch the current bill to get the room and building information
    const currentBill = await Bill.findById(billId).populate({
      path: "roomId",
      populate: {
        path: "floor",
        populate: {
          path: "building",
          select: "waterRate electricityRate rentAmount",
        },
      },
    });

    if (!currentBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Extract rates and rent from the bill
    const waterRate = currentBill.waterRate || 0;
    const electricityRate = currentBill.electricityRate || 0;
    const rentAmount = currentBill.rentAmount || 0;

    // Calculate amounts using the fetched rates
    const waterUsage = Number(updates.waterUsage) || 0;
    const electricityUsage = Number(updates.electricityUsage) || 0;

    const waterAmount = waterUsage * waterRate;
    const electricityAmount = electricityUsage * electricityRate;

    const additionalFeesTotal = Array.isArray(updates.additionalFees)
      ? updates.additionalFees.reduce(
          (sum, fee) => sum + (Number(fee.price) || 0),
          0
        )
      : 0;

    const totalAmount =
      rentAmount + waterAmount + electricityAmount + additionalFeesTotal;

    console.log("Calculated amounts:", {
      waterUsage,
      waterRate,
      waterAmount,
      electricityUsage,
      electricityRate,
      electricityAmount,
      rentAmount,
      additionalFeesTotal,
      totalAmount,
    });

    await Bill.updateOne(
      { _id: billId },
      {
        $set: {
          ...updates,
          waterAmount: waterAmount,
          electricityAmount: electricityAmount,
          totalAmount: totalAmount,
          status:
            waterUsage > 0 && electricityUsage > 0 ? "completed" : "pending",
        },
      }
    );

    const updatedBill = await Bill.findById(billId).populate({
      path: "roomId",
      populate: {
        path: "floor",
        populate: {
          path: "building",
        },
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update bill" },
      { status: 500 }
    );
  }
}
