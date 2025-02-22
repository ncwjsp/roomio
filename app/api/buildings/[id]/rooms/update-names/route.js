import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Room from "@/app/models/Room";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { buildingName } = await request.json();

    // First verify the building exists and belongs to the user
    const building = await Building.findOne({
      _id: id,
      createdBy: session.user.id
    });

    if (!building) {
      return NextResponse.json({ error: "Building not found" }, { status: 404 });
    }

    // Get all rooms for this building
    const rooms = await Room.find({ building: id });
    
    // Update each room's number
    for (const room of rooms) {
      // Extract just the number part (e.g., from "GA101" get "101")
      const roomNumber = room.roomNumber.match(/\d+$/)?.[0];
      if (!roomNumber) continue;
      
      // Create new room number with building prefix (e.g., "B101")
      const newRoomNumber = `${buildingName}${roomNumber}`;
      
      await Room.findByIdAndUpdate(room._id, { roomNumber: newRoomNumber });
    }

    return NextResponse.json({ message: "Room numbers updated successfully" });
  } catch (error) {
    console.error("Error updating room numbers:", error);
    return NextResponse.json(
      { error: "Failed to update room numbers" },
      { status: 500 }
    );
  }
}
