import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import Tenant from "@/app/models/Tenant";
import { format } from "date-fns";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");
    const landlordId = searchParams.get("landlordId");

    if (!lineUserId || !landlordId) {
      return NextResponse.json(
        { error: "Line user ID and landlord ID are required" },
        { status: 400 }
      );
    }

    // First, let's debug what tenants exist
    const allTenants = await Tenant.find({
      landlordId: landlordId,
    });

    // Get tenant's room for this specific landlord
    const tenant = await Tenant.findOne({
      lineUserId: lineUserId,
      landlordId: landlordId,
      active: true,
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found for this Line user" },
        { status: 404 }
      );
    }

    // Get current month's bill
    const currentDate = new Date();
    const currentMonth = format(currentDate, "yyyy-MM");

    const bill = await Bill.findOne({
      roomId: tenant.room,
      month: currentMonth,
      isSent: true
    }).populate({
      path: "roomId",
      select: "roomNumber floor tenant",
      populate: [
        {
          path: "floor",
          select: "building",
          populate: {
            path: "building",
            select: "name createdBy",
            populate: {
              path: "createdBy",
              select: "bankCode accountNumber accountName",
            },
          },
        },
        {
          path: "tenant",
          select: "leaseStartDate leaseEndDate",
        },
      ],
    });

    if (!bill) {
      return NextResponse.json(
        { error: "No current bill found for this month" },
        { status: 404 }
      );
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error fetching current bill:", error);
    return NextResponse.json(
      { error: "Failed to fetch current bill" },
      { status: 500 }
    );
  }
}
