import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Floor from "@/app/models/Floor";
import Room from "@/app/models/Room";

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();

    // Check for existing rooms with similar numbers first
    const existingRooms = await Room.find({
      roomNumber: new RegExp(`^${data.name}\\d+`, "i"),
      createdBy: data.userId,
    });

    if (existingRooms.length > 0) {
      return NextResponse.json(
        {
          error: `Building ${data.name} already exists. Please use a different building name.`,
        },
        { status: 400 }
      );
    }

    // Create building
    const building = new Building({
      name: data.name,
      createdBy: data.userId,
      floors: [],
      electricityRate: data.electricityRate,
      waterRate: data.waterRate,
    });
    await building.save();

    // Create floors and rooms
    const floorPromises = Array.from(
      { length: data.totalFloors },
      async (_, index) => {
        const floorNum = index + 1;

        const floor = new Floor({
          floorNumber: floorNum,
          building: building._id,
          rooms: [],
        });

        // Create rooms for this floor
        const roomPromises = Array.from(
          { length: data.roomsPerFloor },
          async (_, roomIndex) => {
            const roomNum = roomIndex + 1;
            const roomNumber = `${data.name}${floorNum}${String(
              roomNum
            ).padStart(2, "0")}`;

            const room = new Room({
              roomNumber,
              floor: floor._id,
              building: building._id,
              price: data.price,
              status: "Available",
              createdBy: data.userId,
            });

            await room.save();
            floor.rooms.push(room._id);
            return room;
          }
        );

        await Promise.all(roomPromises);
        await floor.save();
        building.floors.push(floor._id);
        return floor;
      }
    );

    await Promise.all(floorPromises);
    await building.save();

    return NextResponse.json({
      success: true,
      building,
    });
  } catch (error) {
    console.error("Building creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create building",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const buildings = await Building.find({ createdBy: userId }).populate({
      path: "floors",
      populate: {
        path: "rooms",
        options: { sort: { roomNumber: 1 } },
      },
    });

    return NextResponse.json({ buildings });
  } catch (error) {
    console.error("Error in GET /api/building:", error);
    return NextResponse.json(
      { error: "Failed to fetch buildings" },
      { status: 500 }
    );
  }
}
