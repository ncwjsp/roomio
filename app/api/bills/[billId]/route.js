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
      select: "roomNumber floor tenant currentMeterReadings price",
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
    
    // Calculate additional fees total - ensure we handle all fee amounts as numbers
    const additionalFeesTotal = (additionalFees || []).reduce((sum, fee) => {
      const feePrice = parseFloat(fee.price || 0);
      console.log(`Processing fee: ${fee.name}, price: ${feePrice}`);
      return sum + feePrice;
    }, 0);

    // Calculate total amount including all components
    const baseAmount = parseFloat(rentAmount || 0);
    const totalAmount = baseAmount + waterAmount + electricityAmount + additionalFeesTotal;

    // Log detailed breakdown of total
    console.log("Amount breakdown:", {
      baseAmount,
      waterAmount,
      electricityAmount,
      additionalFeesTotal,
      totalAmount,
      additionalFees: additionalFees || []
    });

    // Update bill with new values and let the model handle calculations
    const updatedBill = await Bill.findById(billId);
    if (!updatedBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Update all fields
    updatedBill.rentAmount = baseAmount;
    updatedBill.waterUsage = parseFloat(waterUsage || 0);
    updatedBill.electricityUsage = parseFloat(electricityUsage || 0);
    updatedBill.waterRate = parseFloat(waterRate || 0);
    updatedBill.electricityRate = parseFloat(electricityRate || 0);
    updatedBill.waterAmount = waterAmount;
    updatedBill.electricityAmount = electricityAmount;
    updatedBill.additionalFees = additionalFees || [];
    updatedBill.notes = notes || "";
    updatedBill.status = "completed";
    updatedBill.currentMeterReadings = {
      ...currentMeterReadings,
      lastUpdated: new Date()
    };

    // Calculate final amounts using the model's method
    updatedBill.calculateAmounts();
    
    // Save the updated bill
    await updatedBill.save();

    // Populate related fields
    await updatedBill.populate({
      path: "roomId",
      select: "roomNumber floor tenant price",
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

    console.log("Updated bill:", {
      id: updatedBill._id,
      roomNumber: updatedBill.roomId.roomNumber,
      rentAmount: updatedBill.rentAmount,
      waterAmount: updatedBill.waterAmount,
      electricityAmount: updatedBill.electricityAmount,
      additionalFees: updatedBill.additionalFees,
      totalAmount: updatedBill.totalAmount
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
