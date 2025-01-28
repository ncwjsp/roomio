import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Room from "@/app/models/Room";
import Building from "@/app/models/Building";
import Tenant from "@/app/models/Tenant";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(request, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const id = params.id;

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

export async function PUT(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const params = await context.params;
    const roomId = params.id;
    const updates = await request.json();

    const room = await Room.findById(roomId).populate({
      path: "floor",
      populate: {
        path: "building",
        select: "createdBy",
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify ownership
    if (room.floor.building.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { $set: updates },
      { new: true }
    ).populate({
      path: "floor",
      populate: {
        path: "building",
        select: "name",
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

export async function GET(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const params = await context.params;
    const roomId = params.id;

    const room = await Room.findById(roomId)
      .populate({
        path: "floor",
        populate: {
          path: "building",
          select: "name createdBy electricityRate waterRate",
        },
      })
      .populate("tenant", "name phone");

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify ownership
    if (room.floor.building.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}
