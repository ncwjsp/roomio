import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";
import CleaningSchedule from "@/app/models/CleaningSchedule";
import Building from "@/app/models/Building";
import { format } from "date-fns";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");
    const buildingId = searchParams.get("buildingId");
    const landlordId = searchParams.get("landlordId");
    const month = searchParams.get("month") || format(new Date(), "yyyy-MM");

    // If lineUserId is provided, get schedules for housekeeper's buildings
    if (lineUserId) {
      console.log("Fetching schedules for housekeeper:", lineUserId, "requested month:", month);
      const staff = await Staff.findOne({ lineUserId });
      
      if (!staff) {
        console.log("Staff not found for lineUserId:", lineUserId);
        return NextResponse.json({ error: "Staff not found" }, { status: 404 });
      }

      console.log("Found staff:", {
        id: staff._id,
        role: staff.role,
        assignedBuildings: staff.assignedBuildings
      });

      // Get all schedules for this month
      const schedules = await CleaningSchedule.find({
        month: month,
        buildingId: { $in: staff.assignedBuildings }
      }).populate([
        {
          path: 'buildingId',
          select: 'name'
        },
        {
          path: 'slots.bookedBy',
          model: 'Tenant',
          select: 'name phone lineUserId room',
          populate: {
            path: 'room',
            model: 'Room',
            select: 'roomNumber floor'
          }
        }
      ]);

      console.log("API: Found schedules:", {
        count: schedules.length,
        schedules: schedules.map(s => ({
          building: s.buildingId?.name,
          slots: s.slots?.map(slot => ({
            date: slot.date,
            time: `${slot.fromTime}-${slot.toTime}`,
            tenant: slot.bookedBy?.name,
            room: slot.bookedBy?.room?.roomNumber,
            raw: {
              bookedBy: slot.bookedBy,
              room: slot.bookedBy?.room
            }
          }))
        }))
      });

      // Format response
      const formattedSchedules = schedules.map(schedule => ({
        ...schedule.toObject(),
        buildingName: schedule.buildingId?.name || 'Unknown Building',
        slots: schedule.slots?.map(slot => ({
          ...slot.toObject(),
          buildingName: schedule.buildingId?.name || 'Unknown Building',
          roomNumber: slot.bookedBy?.room?.roomNumber
        })) || []
      }));

      return NextResponse.json({ schedules: formattedSchedules });
    }
    
    // If buildingId and landlordId are provided, get schedules for admin panel
    if (buildingId && landlordId) {
      console.log("Fetching schedules for building:", buildingId, "month:", month);
      
      const schedules = await CleaningSchedule.find({
        buildingId,
        month
      }).populate({
        path: 'slots.bookedBy',
        populate: {
          path: 'room',
          select: 'roomNumber'
        }
      });

      return NextResponse.json({ schedules });
    }

    return NextResponse.json(
      { error: "Either lineUserId or buildingId+landlordId are required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}
