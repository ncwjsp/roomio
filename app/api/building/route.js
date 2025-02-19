import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Floor from "@/app/models/Floor";
import Room from "@/app/models/Room";

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();

    // Validate utility rates
    if (!data.electricityRate || data.electricityRate <= 0) {
      return NextResponse.json(
        { error: "Electricity rate must be greater than 0" },
        { status: 400 }
      );
    }

    if (!data.waterRate || data.waterRate <= 0) {
      return NextResponse.json(
        { error: "Water rate must be greater than 0" },
        { status: 400 }
      );
    }

    // Check for existing building with the same name for this user
    const existingBuilding = await Building.findOne({
      name: data.name,
      createdBy: data.userId
    });

    if (existingBuilding) {
      return NextResponse.json(
        {
          error: `You already have a building named ${data.name}. Please use a different building name.`,
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
    for (let i = 1; i <= data.totalFloors; i++) {
      const floor = new Floor({
        building: building._id,
        floorNumber: i,
        rooms: [],
        createdBy: data.userId,
      });
      await floor.save();

      // Create rooms for this floor
      for (let j = 1; j <= data.roomsPerFloor; j++) {
        // Format: A101, A102, etc. (no leading zeros for floor number)
        const roomNumber = `${building.name}${i}${j.toString().padStart(2, "0")}`;
        const room = new Room({
          building: building._id,
          floor: floor._id,
          roomNumber,
          status: "Available",
          price: data.basePrice,
          createdBy: data.userId,
        });
        await room.save();

        // Add room to floor
        floor.rooms.push(room._id);
      }
      await floor.save();

      // Add floor to building
      building.floors.push(floor._id);
    }
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
