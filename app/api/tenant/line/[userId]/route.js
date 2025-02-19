import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const data = await params;

    const { userId } = data;

    const tenant = await Tenant.findOne({ lineUserId: userId })
      .populate({
        path: "room",
        populate: {
          path: "floor",
          populate: {
            path: "building",
          },
        },
      })
      .select(
        "name email phone lineId pfp room depositAmount leaseStartDate leaseEndDate"
      );

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      lineId: tenant.lineId,
      pfp: tenant.pfp,
      room: {
        roomNumber: tenant.room.roomNumber,
        price: tenant.room.price,
        floor: {
          floorNumber: tenant.room.floor.floorNumber,
          building: {
            name: tenant.room.floor.building.name,
            electricityRate: tenant.room.floor.building.electricityRate,
            waterRate: tenant.room.floor.building.waterRate,
          },
        },
      },
      depositAmount: tenant.depositAmount,
      fromDate: tenant.leaseStartDate,
      toDate: tenant.leaseEndDate,
    });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenant information" },
      { status: 500 }
    );
  }
}
