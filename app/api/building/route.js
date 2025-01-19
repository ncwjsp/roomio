import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Floor from "@/app/models/Floor";
import Room from "@/app/models/Room";
import Tenant from "@/app/models/Tenant";

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();

    // Check for existing rooms with similar numbers first
    const existingRooms = await Room.find({
      roomNumber: new RegExp(`^${data.name}\\d+`, "i"),
    });

    if (existingRooms.length > 0) {
      return NextResponse.json(
        {
          error: `Building ${data.name} already has rooms. Please use a different building name.`,
        },
        { status: 400 }
      );
    }

    // Create building
    const building = new Building({
      name: data.name,
      createdBy: data.userId,
      floors: [],
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
              price: data.price,
              status: "Available", // Set default status
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

    // Log the query process
    console.log("Fetching buildings...");

    const buildings = await Building.find({}).populate({
      path: "floors",
      populate: {
        path: "rooms",
        populate: {
          path: "tenant",
        },
      },
    });

    // Log the results
    console.log("Found buildings:", buildings);

    if (!buildings || buildings.length === 0) {
      console.log("No buildings found in database");
    }

    return NextResponse.json({
      success: true,
      buildings: buildings,
      count: buildings.length,
    });
  } catch (error) {
    console.error("Error in building API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch buildings",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
