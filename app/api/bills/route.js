import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import Room from "@/app/models/Room";
import Building from "@/app/models/Building";
import { startOfMonth, endOfMonth } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billData = await request.json();

    // Calculate initial amounts
    const waterUsage = Number(billData.waterUsage) || 0;
    const waterRate = Number(billData.waterRate) || 0;
    const electricityUsage = Number(billData.electricityUsage) || 0;
    const electricityRate = Number(billData.electricityRate) || 0;
    const rentAmount = Number(billData.rentAmount) || 0;

    // Calculate water and electricity amounts
    const waterAmount = waterUsage * waterRate;
    const electricityAmount = electricityUsage * electricityRate;

    // Calculate additional fees total
    const additionalFeesTotal = Array.isArray(billData.additionalFees)
      ? billData.additionalFees.reduce(
          (sum, fee) => sum + (Number(fee.price) || 0),
          0
        )
      : 0;

    // Calculate total amount
    const totalAmount =
      rentAmount + waterAmount + electricityAmount + additionalFeesTotal;

    // Create bill with calculated amounts
    const bill = await Bill.create({
      ...billData,
      waterAmount,
      electricityAmount,
      totalAmount,
      createdBy: session.user.id,
      status: waterUsage > 0 && electricityUsage > 0 ? "completed" : "pending",
    });

    const populatedBill = await Bill.findById(bill._id)
      .populate({
        path: "roomId",
        populate: {
          path: "floor",
          populate: {
            path: "building",
          },
        },
      })
      .populate("tenantId", "firstName lastName");

    return NextResponse.json(populatedBill);
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create bill" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (!month) {
      return NextResponse.json(
        { error: "Month parameter is required" },
        { status: 400 }
      );
    }

    // Get all bills with populated tenant and building info
    const bills = await Bill.find({
      month: month,
      createdBy: session.user.id,
    })
      .populate({
        path: "roomId",
        populate: [
          {
            path: "floor",
            populate: {
              path: "building",
              select: "name billingConfig waterRate electricityRate",
            },
          },
          {
            path: "tenant",
            select: "name leaseStartDate",
            match: { active: true },
          },
        ],
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}
