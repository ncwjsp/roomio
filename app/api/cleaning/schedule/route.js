import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CleaningSchedule from "@/app/models/CleaningSchedule";
import Building from "@/app/models/Building";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  format,
  parse,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  addMinutes,
  parseISO,
  getDay,
} from "date-fns";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Add debug logs
    console.log("Session user:", session.user);

    // Get buildings owned by the landlord
    const buildings = await Building.find({ createdBy: session.user.id });

    // Get schedules if needed
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (month) {
      const schedules = await CleaningSchedule.find({
        landlordId: session.user.id,
        month: month,
      });
      return NextResponse.json({ buildings, schedules });
    }

    return NextResponse.json({ buildings });
  } catch (error) {
    console.error("Error in GET /api/cleaning/schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch data", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    console.log("Received data in API:", {
      month: data.month,
      selectedDays: data.selectedDays,
      slotDuration: data.slotDuration,
      timeRanges: data.timeRanges,
    });

    const { month, selectedDays, slotDuration, timeRanges, buildingId } = data;

    // Validate timeRanges
    if (
      !timeRanges ||
      !timeRanges.length ||
      !timeRanges[0].start ||
      !timeRanges[0].end
    ) {
      throw new Error("Invalid time ranges format");
    }

    // Parse the month (e.g., "2025-02")
    const [year, monthNum] = month.split("-");
    console.log("Year and Month:", { year, monthNum });

    // Generate slots for each selected day
    let slots = [];
    console.log("Starting slot generation for days:", selectedDays);

    selectedDays.forEach((day) => {
      console.log("Processing day:", day);
      console.log("Time ranges:", timeRanges);

      // Create a date object for this day
      const dateStr = `${year}-${monthNum}-${String(day).padStart(2, "0")}`;
      console.log("Created date string:", dateStr);

      timeRanges.forEach((range) => {
        console.log("Processing time range:", range);

        try {
          // Create start and end times for this range
          const startDateTime = new Date(`${dateStr}T${range.start}`);
          const endDateTime = new Date(`${dateStr}T${range.end}`);

          console.log("Time range parsed:", {
            start: startDateTime,
            end: endDateTime,
          });

          let currentTime = startDateTime;
          while (currentTime < endDateTime) {
            const slotEndTime = new Date(currentTime);
            slotEndTime.setMinutes(slotEndTime.getMinutes() + slotDuration);

            if (slotEndTime <= endDateTime) {
              const slot = {
                date: dateStr,
                fromTime: format(currentTime, "HH:mm"),
                toTime: format(slotEndTime, "HH:mm"),
                bookedBy: null,
                bookedAt: null,
              };
              console.log("Created slot:", slot);
              slots.push(slot);
            }

            currentTime = slotEndTime;
          }
        } catch (error) {
          console.error("Error processing time range:", error);
        }
      });
    });

    console.log("Final generated slots:", slots);

    // Create schedule with generated slots
    const schedule = await CleaningSchedule.create({
      month,
      selectedDays,
      slotDuration,
      timeRanges,
      buildingId,
      landlordId: session.user.id,
      slots: slots,
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating cleaning schedule:", error);
    return NextResponse.json(
      {
        error: "Failed to create cleaning schedule",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
