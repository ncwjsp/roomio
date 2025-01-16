import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Room from "@/app/models/Room";
import Building from "@/app/models/Building";
import Tenant from "@/app/models/Tenant";
import mongoose from "mongoose";

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if room is occupied
    if (room.status === "Occupied") {
      return NextResponse.json(
        { error: "Cannot delete an occupied room" },
        { status: 400 }
      );
    }

    // Remove room from building's rooms array
    await Building.findByIdAndUpdate(room.building, {
      $pull: { rooms: room._id },
    });

    await Room.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Room deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const data = await req.json();

    // Check if room exists
    const existingRoom = await Room.findById(id);
    if (!existingRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if new room number already exists (excluding current room)
    if (data.roomNumber !== existingRoom.roomNumber) {
      const duplicateRoom = await Room.findOne({
        roomNumber: data.roomNumber,
        _id: { $ne: id },
      });
      if (duplicateRoom) {
        return NextResponse.json(
          { error: "Room number already exists" },
          { status: 409 }
        );
      }
    }

    // If building is being changed, update both old and new building's rooms arrays
    if (data.building && data.building !== existingRoom.building.toString()) {
      // Remove room from old building
      await Building.findByIdAndUpdate(existingRoom.building, {
        $pull: { rooms: existingRoom._id },
      });

      // Add room to new building
      await Building.findByIdAndUpdate(data.building, {
        $push: { rooms: existingRoom._id },
      });
    }

    // Update room
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      {
        roomNumber: data.roomNumber,
        floor: data.floor,
        status: data.status,
        price: data.price,
        building: data.building || existingRoom.building,
      },
      { new: true }
    ).populate("building", "name");

    return NextResponse.json(updatedRoom, { status: 200 });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    // Log the room first to check the building reference
    const rawRoom = await Room.findOne({ _id: id });
    console.log("Building reference:", rawRoom?.building);

    const room = await Room.findOne({ _id: id })
      .populate({
        path: "building",
        select: "name",
      })
      .lean();

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Format the response with better null handling
    const formattedRoom = {
      _id: room._id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      status: room.status,
      building: room.building
        ? {
            _id: room.building._id,
            name: room.building.name,
          }
        : null, // Return null instead of empty object if no building
      tenant: room.tenant,
      price: room.price,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };

    return NextResponse.json(formattedRoom, { status: 200 });
  } catch (error) {
    console.error("Full error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch room",
        message: error.message,
        params: params,
      },
      { status: 500 }
    );
  }
}
