import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Room from "@/app/models/Room";
import Floor from "@/app/models/Floor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { floor: floorId, roomNumber, price } = await request.json();

    // Validate required fields
    if (!floorId || !roomNumber || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First get the floor to get its building ID
    const floor = await Floor.findById(floorId).populate("building");
    if (!floor) {
      return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    }

    // Create new room
    const room = await Room.create({
      floor: floorId,
      building: floor.building._id,
      roomNumber,
      price,
      status: "Available",
      createdBy: session.user.id,
    });

    // Update the floor to include this room
    await Floor.findByIdAndUpdate(
      floorId,
      { $push: { rooms: room._id } },
      { new: true }
    );

    // Populate the room data
    const populatedRoom = await Room.findById(room._id).populate({
      path: "floor",
      populate: {
        path: "building",
      },
    });

    return NextResponse.json(populatedRoom, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }

    // Fetch rooms with populated data
    const rooms = await Room.find(query)
      .populate({
        path: "floor",
        populate: {
          path: "building",
        },
      })
      .sort({ roomNumber: 1 });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
