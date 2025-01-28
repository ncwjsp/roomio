import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Room from "@/app/models/Room";
import Floor from "@/app/models/Floor";
import Building from "@/app/models/Building";

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();

    // Validate building exists
    const building = await Building.findById(data.buildingId);
    if (!building) {
      return NextResponse.json(
        { message: "Building not found" },
        { status: 404 }
      );
    }

    // Check if room number already exists in this building
    const existingRoom = await Room.findOne({
      building: data.buildingId,
      roomNumber: data.roomNumber,
    });

    if (existingRoom) {
      return NextResponse.json(
        { message: `Room ${data.roomNumber} already exists in this building` },
        { status: 400 }
      );
    }

    // Create room
    const room = await Room.create({
      building: data.buildingId,
      roomNumber: data.roomNumber,
      floor: data.floor,
      price: data.price,
      status: "Available",
      createdBy: data.createdBy,
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("Error in room API:", error);
    return NextResponse.json(
      { message: "Failed to create room", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId");
    const status = searchParams.get("status");

    console.log("Fetching rooms with params:", { buildingId, status }); // Debug log

    if (!buildingId) {
      return NextResponse.json(
        { error: "Building ID is required" },
        { status: 400 }
      );
    }

    // Build query
    const query = {
      building: buildingId,
    };

    if (status) {
      query.status = status;
    }

    console.log("Query:", query); // Debug log

    const rooms = await Room.find(query)
      .populate("tenant")
      .populate({
        path: "floor",
        populate: {
          path: "building",
          select: "name",
        },
      });

    console.log("Found rooms:", rooms.length); // Debug log

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Error in room API:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms", details: error.message },
      { status: 500 }
    );
  }
}
