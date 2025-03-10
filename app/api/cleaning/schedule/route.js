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
    const buildingId = searchParams.get("buildingId");
    const month = searchParams.get("month");
    const id = searchParams.get("id");

    if (id) {
      // Fetch a specific schedule by ID
      const schedule = await CleaningSchedule.findOne({
        _id: id,
        landlordId: session.user.id,
      }).populate({
        path: "slots.bookedBy",
        populate: {
          path: "room",
        },
      });

      if (!schedule) {
        return NextResponse.json(
          { error: "Schedule not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(schedule);
    }

    // Existing code to fetch schedules by buildingId and month
    let query = { landlordId: session.user.id };

    if (buildingId) {
      query.buildingId = buildingId;
    }

    if (month) {
      query.month = month;
    }

    const schedules = await CleaningSchedule.find(query)
      .populate({
        path: "slots.bookedBy",
        populate: {
          path: "room",
        },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ buildings, schedules });
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

    // Check if schedule already exists for this month
    const existingSchedule = await CleaningSchedule.findOne({
      month,
      landlordId: session.user.id,
      buildingId,
    });

    if (existingSchedule) {
      return NextResponse.json(
        { error: "A schedule already exists for this month" },
        { status: 400 }
      );
    }

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

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for proper comparison

    selectedDays.forEach((day) => {
      console.log("Processing day:", day);
      console.log("Time ranges:", timeRanges);

      // Create a date object for this day
      const dateStr = `${year}-${monthNum}-${String(day).padStart(2, "0")}`;
      const currentDate = new Date(dateStr);

      // Skip if date is in the past
      if (currentDate < today) {
        console.log("Skipping past date:", dateStr);
        return;
      }

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

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    const { scheduleId, selectedDays } = data;

    if (!scheduleId || !selectedDays || !Array.isArray(selectedDays)) {
      return NextResponse.json(
        { error: "Schedule ID and selected days array are required" },
        { status: 400 }
      );
    }

    // Find the existing schedule
    const existingSchedule = await CleaningSchedule.findOne({
      _id: scheduleId,
      landlordId: session.user.id,
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check for booked slots that would be affected by removing days
    const daysThatCannotBeRemoved = [];
    existingSchedule.slots.forEach(slot => {
      if (slot.bookedBy || slot.bookedAt) {
        const slotDay = parseInt(slot.date.split('-')[2], 10);
        // If this day is in the existing schedule but not in the new selection
        if (existingSchedule.selectedDays.includes(slotDay) && !selectedDays.includes(slotDay)) {
          daysThatCannotBeRemoved.push(slotDay);
        }
      }
    });

    if (daysThatCannotBeRemoved.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot remove days with booked slots", 
          days: daysThatCannotBeRemoved.sort((a, b) => a - b) 
        },
        { status: 400 }
      );
    }

    // Get the time ranges and slot duration from the existing schedule
    const { timeRanges, slotDuration } = existingSchedule;

    // Generate new slots based on selected days and existing time ranges
    let slots = [];
    const [year, monthNum] = existingSchedule.month.split("-");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    selectedDays.forEach((day) => {
      const dateStr = `${year}-${monthNum}-${String(day).padStart(2, "0")}`;
      const currentDate = new Date(dateStr);

      // Skip if date is in the past
      if (currentDate < today) {
        return;
      }

      timeRanges.forEach((range) => {
        try {
          const startDateTime = new Date(`${dateStr}T${range.start}`);
          const endDateTime = new Date(`${dateStr}T${range.end}`);
          let currentTime = startDateTime;

          while (currentTime < endDateTime) {
            const slotEndTime = new Date(currentTime);
            slotEndTime.setMinutes(slotEndTime.getMinutes() + slotDuration);

            if (slotEndTime <= endDateTime) {
              // Check for existing booked slots on this day and time
              const existingSlot = existingSchedule.slots.find(
                slot => 
                  slot.date === dateStr && 
                  slot.fromTime === format(currentTime, "HH:mm") && 
                  slot.toTime === format(slotEndTime, "HH:mm") && 
                  (slot.bookedBy || slot.bookedAt)
              );

              if (existingSlot) {
                // Preserve the booked slot
                slots.push(existingSlot);
              } else {
                // Create a new available slot
                slots.push({
                  date: dateStr,
                  fromTime: format(currentTime, "HH:mm"),
                  toTime: format(slotEndTime, "HH:mm"),
                  bookedBy: null,
                  bookedAt: null,
                });
              }
            }

            currentTime = slotEndTime;
          }
        } catch (error) {
          console.error("Error processing time range:", error);
        }
      });
    });

    // Update the schedule with new selected days and slots
    const updatedSchedule = await CleaningSchedule.findByIdAndUpdate(
      scheduleId,
      {
        $set: {
          selectedDays,
          slots,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error("Error updating cleaning schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule", details: error.message },
      { status: 500 }
    );
  }
}
