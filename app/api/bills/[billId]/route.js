import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import { parse } from "url";
import Building from "@/app/models/Building";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
  try {
    await dbConnect();

    const { pathname } = parse(request.url);
    const billId = pathname.split("/").pop();

    const bill = await Bill.findById(billId).populate({
      path: "roomId",
      select: "roomNumber floor tenant currentMeterReadings",
      populate: [
        {
          path: "floor",
          select: "building number",
          populate: {
            path: "building",
            select: "name waterRate electricityRate",
          },
        },
        {
          path: "tenant",
          select: "leaseStartDate firstName lastName",
        },
      ],
    });

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

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { billId } = params;
    const updates = await request.json();
    console.log("Received updates:", updates);

    const {
      rentAmount,
      waterUsage,
      electricityUsage,
      waterRate,
      electricityRate,
      additionalFees,
      notes,
      currentMeterReadings,
    } = updates;

    // Log input values
    console.log("Calculating amounts with:", {
      waterUsage,
      electricityUsage,
      waterRate,
      electricityRate,
      rentAmount,
      additionalFees
    });

    // Calculate amounts with proper type conversion
    const waterAmount = parseFloat(waterUsage || 0) * parseFloat(waterRate || 0);
    const electricityAmount = parseFloat(electricityUsage || 0) * parseFloat(electricityRate || 0);
    const additionalAmount = (additionalFees || []).reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);
    const totalAmount = parseFloat(rentAmount || 0) + waterAmount + electricityAmount + additionalAmount;

    // Log calculated amounts
    console.log("Calculated amounts:", {
      waterAmount,
      electricityAmount,
      additionalAmount,
      totalAmount
    });

    // Update bill with new values
    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      {
        $set: {
          rentAmount: parseFloat(rentAmount || 0),
          waterUsage: parseFloat(waterUsage || 0),
          electricityUsage: parseFloat(electricityUsage || 0),
          waterRate: parseFloat(waterRate || 0),
          electricityRate: parseFloat(electricityRate || 0),
          waterAmount,
          electricityAmount,
          totalAmount,
          additionalFees: additionalFees || [],
          notes: notes || "",
          status: "completed",
          currentMeterReadings: {
            ...currentMeterReadings,
            lastUpdated: new Date()
          }
        },
      },
      { new: true }
    ).populate({
      path: "roomId",
      select: "roomNumber floor tenant",
      populate: [
        {
          path: "floor",
          select: "building number",
          populate: {
            path: "building",
            select: "name",
          },
        },
        {
          path: "tenant",
          select: "firstName lastName",
        },
      ],
    });

    if (!updatedBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    console.log("Updated bill:", updatedBill);
    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update bill" },
      { status: 500 }
    );
  }
}
