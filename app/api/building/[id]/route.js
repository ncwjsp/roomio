import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Room from "@/app/models/Room";
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

// DELETE building and its rooms
export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    await dbConnect();

    const building = await Building.findById(id);
    if (!building) {
      return NextResponse.json(
        { error: "Building not found" },
        { status: 404 }
      );
    }

    const occupiedRooms = await Room.findOne({
      building: id,
      status: "Occupied",
    });

    if (occupiedRooms) {
      return NextResponse.json(
        { error: "Cannot delete building with occupied rooms" },
        { status: 400 }
      );
    }

    await Room.deleteMany({ building: id });
    await Building.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Building and associated rooms deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete building" },
      { status: 500 }
    );
  }
}
