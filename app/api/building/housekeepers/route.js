import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Staff from "@/app/models/Staff";
import mongoose from "mongoose";

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

    // Get all available housekeepers (staff with role 'Housekeeper', matching landlordId, and not assigned to any building)
    const allHousekeepers = await Staff.find({ 
      role: 'Housekeeper',
      landlordId: landlordId,
      assignedBuildings: { $size: 0 }, // Only get housekeepers not assigned to any building
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
      return NextResponse.json(
        { error: "Building ID and housekeeper ID are required" },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(buildingId) || !mongoose.Types.ObjectId.isValid(housekeeperId)) {
      return NextResponse.json(
        { error: "Invalid Building ID or Housekeeper ID format" },
        { status: 400 }
      );
    }

    // First check if both building and staff exist
    const [building, staff] = await Promise.all([
      Building.findById(buildingId),
      Staff.findById(housekeeperId)
    ]);

    if (!building) {
      return NextResponse.json({ error: "Building not found" }, { status: 404 });
    }

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Check if housekeeper is already assigned to any building
    if (staff.assignedBuildings && staff.assignedBuildings.length > 0) {
      return NextResponse.json(
        { error: "This housekeeper is already assigned to another building" },
        { status: 400 }
      );
    }

    // Update both documents
    const [updatedBuilding] = await Promise.all([
      Building.findByIdAndUpdate(
        buildingId,
        { $addToSet: { housekeepers: housekeeperId } },
        { new: true }
      ).populate({
        path: 'housekeepers',
        select: 'firstName lastName phone lineUserId'
      }),
      Staff.findByIdAndUpdate(
        housekeeperId,
        { $set: { assignedBuildings: [buildingId] } }, // Use $set instead of $addToSet to ensure only one building
        { new: true }
      )
    ]);

    return NextResponse.json({ housekeepers: updatedBuilding.housekeepers });
  } catch (error) {
    console.error("Error adding housekeeper:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add housekeeper" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId");
    const housekeeperId = searchParams.get("housekeeperId");

    if (!buildingId || !housekeeperId) {
      return NextResponse.json(
        { error: "Building ID and housekeeper ID are required" },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(buildingId) || !mongoose.Types.ObjectId.isValid(housekeeperId)) {
      return NextResponse.json(
        { error: "Invalid Building ID or Housekeeper ID format" },
        { status: 400 }
      );
    }

    // First check if both building and staff exist
    const [building, staff] = await Promise.all([
      Building.findById(buildingId),
      Staff.findById(housekeeperId)
    ]);

    if (!building) {
      return NextResponse.json({ error: "Building not found" }, { status: 404 });
    }

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Update both documents
    const [updatedBuilding] = await Promise.all([
      Building.findByIdAndUpdate(
        buildingId,
        { $pull: { housekeepers: housekeeperId } },
        { new: true }
      ).populate({
        path: 'housekeepers',
        select: 'firstName lastName phone lineUserId'
      }),
      Staff.findByIdAndUpdate(
        housekeeperId,
        { $set: { assignedBuildings: [] } }, // Use $set instead of $pull to ensure no other buildings are assigned
        { new: true }
      )
    ]);

    return NextResponse.json({ housekeepers: updatedBuilding.housekeepers });
  } catch (error) {
    console.error("Error removing housekeeper:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove housekeeper" },
      { status: 500 }
    );
  }
}
