import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    console.log("Received tenant data:", data); // Debug log

    // Validate required fields
    if (
      !data.room ||
      !data.leaseStartDate ||
      !data.leaseEndDate ||
      !data.depositAmount
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find and update room status
    const room = await Room.findById(data.room);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.status === "Occupied") {
      return NextResponse.json(
        { error: "Room is already occupied" },
        { status: 400 }
      );
    }

    // Create tenant
    const tenant = new Tenant({
      name: data.name,
      email: data.email,
      phone: data.phone,
      lineId: data.lineId,
      depositAmount: data.depositAmount,
      leaseStartDate: data.leaseStartDate,
      leaseEndDate: data.leaseEndDate,
      room: data.room,
      owner: data.owner,
    });

    // Save tenant
    await tenant.save();
    console.log("Tenant saved:", tenant); // Debug log

    // Update room status and tenant reference
    room.status = "Occupied";
    room.tenant = tenant._id;
    await room.save();
    console.log("Room updated:", room); // Debug log

    return NextResponse.json({
      success: true,
      tenant,
      room,
    });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json(
      { error: "Failed to create tenant", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    const query = userId ? { owner: userId } : {};

    const tenants = await Tenant.find(query).populate({
      path: "room",
      populate: {
        path: "floor",
        populate: {
          path: "building",
          select: "name",
        },
      },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}
