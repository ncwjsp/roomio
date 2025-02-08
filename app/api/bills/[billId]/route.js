import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import { parse } from "url";
import Building from "@/app/models/Building";

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

export async function PUT(request, context) {
  try {
    await dbConnect();
    const updates = await request.json();

    const appContext = await context;

    const { billId } = appContext.params;

    // Fetch the current bill with tenant info
    const currentBill = await Bill.findById(billId).populate({
      path: "roomId",
      populate: [
        {
          path: "floor",
          populate: {
            path: "building",
            select: "waterRate electricityRate",
          },
        },
        {
          path: "tenant",
          select: "leaseStartDate",
        },
      ],
    });

    if (!currentBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Calculate pro-rated rent if needed
    const calculateProRatedRent = (rentAmount, leaseStartDate) => {
      const billingCycleDate = new Date(currentBill.month);
      const daysInMonth = new Date(
        billingCycleDate.getFullYear(),
        billingCycleDate.getMonth() + 1,
        0
      ).getDate();

      const moveInDate = new Date(leaseStartDate);

      // Calculate days from move-in to end of month
      const daysStayed =
        Math.ceil(
          (new Date(
            billingCycleDate.getFullYear(),
            billingCycleDate.getMonth() + 1,
            0
          ) -
            moveInDate) /
            (1000 * 60 * 60 * 24)
        ) + 1; // Add 1 to include the move-in day

      console.log("Pro-rate details:", {
        daysInMonth,
        daysStayed,
        moveInDate: moveInDate.toISOString(),
        dailyRate: rentAmount / daysInMonth,
        proRatedAmount: Math.round((rentAmount / daysInMonth) * daysStayed),
      });

      return Math.round((rentAmount / daysInMonth) * daysStayed);
    };

    // Determine rent amount based on isFullRent flag
    const rentToUse = updates.isFullRent
      ? currentBill.rentAmount
      : calculateProRatedRent(
          currentBill.rentAmount,
          currentBill.roomId.tenant?.leaseStartDate
        );

    console.log("Rent calculation:", {
      isFullRent: updates.isFullRent,
      originalRent: currentBill.rentAmount,
      calculatedRent: rentToUse,
      leaseStartDate: currentBill.roomId.tenant?.leaseStartDate,
    });

    // Calculate other amounts
    const waterUsage = Number(updates.waterUsage) || 0;
    const electricityUsage = Number(updates.electricityUsage) || 0;
    const waterAmount = waterUsage * currentBill.waterRate;
    const electricityAmount = electricityUsage * currentBill.electricityRate;
    const additionalFeesTotal = Array.isArray(updates.additionalFees)
      ? updates.additionalFees.reduce(
          (sum, fee) => sum + (Number(fee.price) || 0),
          0
        )
      : 0;

    // Calculate total with the correct rent amount
    const totalAmount =
      rentToUse + waterAmount + electricityAmount + additionalFeesTotal;

    // Update the bill
    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      {
        ...updates,
        actualRentAmount: rentToUse,
        waterAmount,
        electricityAmount,
        totalAmount,
      },
      { new: true }
    );

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { error: "Failed to update bill" },
      { status: 500 }
    );
  }
}
