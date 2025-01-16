import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Room from "@/app/models/Room";
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

export async function GET() {
  try {
    await dbConnect();

    const rooms = await Room.find({})
      .populate("building", "name") // Get building name
      .sort({ roomNumber: 1 }); // Sort by room number

    const formattedRooms = rooms.map((room) => ({
      _id: room._id,
      name: room.roomNumber,
      floor: room.floor,
      building: room.building,
      status: room.status,
      price: room.price,
      buildingId: room.building?._id,
    }));

    return NextResponse.json({ rooms: formattedRooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
