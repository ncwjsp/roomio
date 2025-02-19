import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Room from "@/app/models/Room";
import Floor from "@/app/models/Floor"; // Added missing import
import mongoose from "mongoose";

// GET building by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const building = await Building.findById(id).populate({
      path: "floors",
      populate: {
        path: "rooms",
        populate: "tenant",
      },
    });

    if (!building) {
      return NextResponse.json(
        { error: "Building not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(building);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch building" },
      { status: 500 }
    );
  }
}

// PUT (update) building
export async function PUT(request, { params }) {
  const { id } = await params;
  const data = await request.json();

  try {
    await dbConnect();

    // First, get all rooms for this building
    const rooms = await Room.find({ building: id });

    // Update all room numbers with the new building name
    const updatePromises = rooms.map((room) => {
      const oldRoomNumber = room.roomNumber;
      // Extract just the floor and number (last 3 digits)
      const floorAndNumber = oldRoomNumber.slice(-3); // Get last 3 digits
      const newRoomNumber = `${data.name}${floorAndNumber}`; // Add new building name

      return Room.findByIdAndUpdate(
        room._id,
        { roomNumber: newRoomNumber },
        { new: true }
      );
    });

    // Update all rooms
    await Promise.all(updatePromises);

    // Update building name
    const building = await Building.findByIdAndUpdate(
      id,
      { name: data.name },
      { new: true }
    );

    if (!building) {
      return NextResponse.json(
        { error: "Building not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(building);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update building" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    const building = await Building.findById(id).populate({
      path: "floors",
      populate: {
        path: "rooms",
      },
    });

    if (!building) {
      return NextResponse.json(
        { error: "Building not found" },
        { status: 404 }
      );
    }

    // Check if any rooms are occupied
    const hasOccupiedRooms = building.floors.some((floor) =>
      floor.rooms.some((room) => room.status === "Occupied")
    );

    if (hasOccupiedRooms) {
      return NextResponse.json(
        {
          error: "Cannot delete building with occupied rooms",
        },
        { status: 400 }
      );
    }

    // Delete all associated rooms first
    for (const floor of building.floors) {
      await Room.deleteMany({ _id: { $in: floor.rooms } });
    }

    // Delete all floors
    await Floor.deleteMany({ _id: { $in: building.floors } });

    // Finally delete the building
    await Building.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Building deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete building" },
      { status: 500 }
    );
  }
}
