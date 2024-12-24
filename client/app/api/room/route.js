import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Room from "@/app/models/Room";
import Building from "@/app/models/Building";

export async function POST(req) {
  try {
    const { roomNumber, floor, status, buildingId, tenant, price } =
      await req.json();

    // Connect to the database
    await dbConnect();

    // Check if the building exists
    const building = await Building.findById(buildingId);
    if (!building) {
      return NextResponse.json(
        { message: "Building not found" },
        { status: 404 }
      );
    }

    // Check if the room number is unique within the building
    const existingRoom = await Room.findOne({
      roomNumber,
      building: buildingId,
    });
    if (existingRoom) {
      return NextResponse.json(
        { message: "Room number already exists in this building" },
        { status: 409 }
      );
    }

    // Create a new room linked to the building
    const newRoom = await Room.create({
      roomNumber,
      floor,
      status,
      building: buildingId, // Reference to the building
      tenant, // Reference to the tenant (if any)
      price, // Room price
    });

    // Optionally, you can update the building with the new room (if needed)
    building.rooms.push(newRoom._id);
    await building.save();

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error("Error in creating room:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the room" },
      { status: 500 }
    );
  }
}
