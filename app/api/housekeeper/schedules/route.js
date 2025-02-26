import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";
import CleaningSchedule from "@/app/models/CleaningSchedule";

export async function GET(request) {
  try {
    await dbConnect();

    // Get lineUserId from query params
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");
    if (!lineUserId) {
      return NextResponse.json({ error: "Line User ID is required" }, { status: 400 });
    }

    // Get staff and their assigned buildings
    const staff = await Staff.findOne({ lineId: lineUserId })
      .populate('assignedBuildings');

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Get schedules for all assigned buildings
    const buildingIds = staff.assignedBuildings.map(b => b._id);
    const schedules = await CleaningSchedule.find({
      buildingId: { $in: buildingIds }
    }).populate({
      path: 'slots.bookedBy',
      populate: {
        path: 'room',
        select: 'roomNumber'
      }
    });

    // Add building names to schedules
    const buildingMap = staff.assignedBuildings.reduce((map, building) => {
      map[building._id.toString()] = building.name;
      return map;
    }, {});

    const schedulesWithBuildingNames = schedules.map(schedule => ({
      ...schedule.toObject(),
      buildingName: buildingMap[schedule.buildingId.toString()]
    }));

    return NextResponse.json({ schedules: schedulesWithBuildingNames });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}
