import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import Tenant from "@/app/models/Tenant";

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

    // Get the latest sent bill for this tenant's room
    const latestBill = await Bill.findOne({
      roomId: tenant.room,
      isSent: true,
    })
      .sort({ month: -1 }) // Sort by month in descending order
      .populate({
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

    if (!latestBill) {
      return NextResponse.json(
        { error: "No bills found for this tenant" },
        { status: 404 }
      );
    }

    return NextResponse.json(latestBill);
  } catch (error) {
    console.error("Error fetching latest bill:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest bill" },
      { status: 500 }
    );
  }
}
