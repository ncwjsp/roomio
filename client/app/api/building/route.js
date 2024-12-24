import dbConnect from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import Building from "@/app/models/Building";
import Room from "@/app/models/Room";

export async function POST(req) {
  try {
    const { name, price, numFloors, roomsPerFloor, createdBy } =
      await req.json();

    // Connect to DB
    await dbConnect();

    // Create the building document
    const building = new Building({
      name,
      price,
      createdBy, // Replace with actual user ID if necessary
    });

    // Save the building
    await building.save();

    // Array to hold rooms to be added to the building
    let roomsToAdd = [];

    // Generate and create rooms based on floors and rooms per floor
    for (let floor = 1; floor <= numFloors; floor++) {
      for (let roomNumber = 1; roomNumber <= roomsPerFloor; roomNumber++) {
        const roomId = `${name}${floor}${roomNumber
          .toString()
          .padStart(2, "0")}`;

        // Create a new room with the required fields
        const room = new Room({
          building: building.name, // Set the building field
          roomNumber: roomId, // Set the room number
          floor,
          status: "Available",
          price: price,
        });

        // Save the room to the database
        await room.save();

        // Add the room ID to the array to push to the building later
        roomsToAdd.push(room._id);
      }
    }

    // Update the building with the list of room IDs
    building.rooms = roomsToAdd;
    await building.save(); // Save the updated building document

    return NextResponse.json(building, { status: 201 });
  } catch (error) {
    console.error("Error creating building and rooms:", error);
    return NextResponse.json(
      { message: "Error creating building and rooms" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Missing 'id' parameter" },
        { status: 400 }
      );
    }

    await dbConnect();

    const buildings = await Building.find({ createdBy: id });

    const roomIds = buildings.flatMap((building) => building.rooms);

    if (roomIds.length > 0) {
      // Fetch the room details using the room ids
      const rooms = await Room.find({
        _id: { $in: roomIds.map((id) => new ObjectId(id)) },
      });

      console.log(rooms); // Log the room details

      return NextResponse.json({ buildings, rooms }, { status: 200 });
    } else {
      return NextResponse.json(
        { message: "No rooms found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ buildings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching buildings:", error);
    return NextResponse.json(
      { message: "Error fetching buildings" },
      { status: 500 }
    );
  }
}

// export async function DELETE(req) {
//   try {
//     const id = req.nextUrl.searchParams.get("id");

//     if (!id) {
//       return NextResponse.json(
//         { message: "User ID is required" },
//         { status: 400 }
//       );
//     }

//     await dbConnect();

//     await User.findByIdAndDelete(id);

//     return NextResponse.json({ message: "User deleted" }, { status: 200 });
//   } catch (error) {
//     console.error("Error in DELETE request:", error);
//     return NextResponse.json(
//       { message: "An error occurred while deleting the user" },
//       { status: 500 }
//     );
//   }
// }
