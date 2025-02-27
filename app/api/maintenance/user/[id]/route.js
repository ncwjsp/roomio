import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/app/models/Maintenance";
import Room from "@/app/models/Room";
import Building from "@/app/models/Building";
import Floor from "@/app/models/Floor";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const data = await params;

    const tickets = await Maintenance.find({
      landlordId: data.id,
    })
      .populate({
        path: "room",
        model: Room,
        select: "roomNumber building floor",
        populate: [
          { path: "building", model: Building, select: "name" },
          { path: "floor", model: Floor, select: "floorNumber" }
        ]
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching maintenance tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance tickets" },
      { status: 500 }
    );
  }
}
