import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Floor from "@/app/models/Floor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const building = await params;

    const buildingId = building.id;
    const floors = await Floor.find({ building: buildingId }).sort({
      floorNumber: 1,
    });

    return NextResponse.json({ floors });
  } catch (error) {
    console.error("Error fetching floors:", error);
    return NextResponse.json(
      { error: "Failed to fetch floors" },
      { status: 500 }
    );
  }
}
