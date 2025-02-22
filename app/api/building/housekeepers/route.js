import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Staff from "@/app/models/Staff";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId");
    const landlordId = searchParams.get("landlordId");

    if (!buildingId || !landlordId) {
      return NextResponse.json({ error: "Building ID and landlord ID are required" }, { status: 400 });
    }

    // Get building with populated housekeepers
    const building = await Building.findById(buildingId).populate({
      path: 'housekeepers',
      select: 'firstName lastName phone lineUserId',
      match: { landlordId: landlordId } // Only populate housekeepers belonging to this landlord
    });

    if (!building) {
      return NextResponse.json({ error: "Building not found" }, { status: 404 });
    }

    // Get all available housekeepers (staff with role 'Housekeeper' and matching landlordId)
    const allHousekeepers = await Staff.find({ 
      role: 'Housekeeper',
      landlordId: landlordId,
      _id: { $nin: building.housekeepers?.map(h => h._id) || [] }
    }).select('firstName lastName phone lineUserId');

    return NextResponse.json({
      assignedHousekeepers: building.housekeepers || [],
      availableHousekeepers: allHousekeepers
    });

  } catch (error) {
    console.error("Error fetching housekeepers:", error);
    return NextResponse.json({ error: "Failed to fetch housekeepers" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    const { buildingId, housekeeperId } = data;

    if (!buildingId || !housekeeperId) {
      return NextResponse.json({ error: "Building ID and housekeeper ID are required" }, { status: 400 });
    }

    // Add housekeeper to building
    const building = await Building.findByIdAndUpdate(
      buildingId,
      { $addToSet: { housekeepers: housekeeperId } },
      { new: true }
    ).populate({
      path: 'housekeepers',
      select: 'firstName lastName phone lineUserId'
    });

    if (!building) {
      return NextResponse.json({ error: "Building not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Housekeeper added successfully",
      housekeepers: building.housekeepers || []
    });

  } catch (error) {
    console.error("Error adding housekeeper:", error);
    return NextResponse.json({ error: "Failed to add housekeeper" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId");
    const housekeeperId = searchParams.get("housekeeperId");

    if (!buildingId || !housekeeperId) {
      return NextResponse.json({ error: "Building ID and housekeeper ID are required" }, { status: 400 });
    }

    // Remove housekeeper from building
    const building = await Building.findByIdAndUpdate(
      buildingId,
      { $pull: { housekeepers: housekeeperId } },
      { new: true }
    ).populate({
      path: 'housekeepers',
      select: 'firstName lastName phone lineUserId'
    });

    if (!building) {
      return NextResponse.json({ error: "Building not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Housekeeper removed successfully",
      housekeepers: building.housekeepers || []
    });

  } catch (error) {
    console.error("Error removing housekeeper:", error);
    return NextResponse.json({ error: "Failed to remove housekeeper" }, { status: 500 });
  }
}
