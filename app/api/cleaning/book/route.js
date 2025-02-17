import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CleaningSchedule from "@/app/models/CleaningSchedule";
import Tenant from "@/app/models/Tenant";
import { format, parseISO } from "date-fns";
import { getLineClient } from "@/lib/line";

export async function POST(request) {
  try {
    await dbConnect();
    const { slotId, scheduleId, lineUserId, landlordId } = await request.json();

    // Validate tenant
    const tenant = await Tenant.findOne({
      lineUserId,
      landlordId,
      active: true,
    }).populate("room");

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Find and update the slot
    const schedule = await CleaningSchedule.findById(scheduleId);
    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    const slot = schedule.slots.id(slotId);
    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.bookedBy) {
      return NextResponse.json(
        { error: "Slot already booked" },
        { status: 400 }
      );
    }

    // Update the slot
    slot.bookedBy = tenant._id;
    slot.bookedAt = new Date();
    await schedule.save();

    // Send Line notification
    const message = {
      type: "flex",
      altText: "Cleaning Booking Confirmed",
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "Cleaning Booking Confirmed",
              weight: "bold",
              size: "lg",
              color: "#FFFFFF",
            },
          ],
          backgroundColor: "#898F63",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              margin: "lg",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "Date",
                      color: "#aaaaaa",
                      size: "sm",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: format(parseISO(slot.date), "EEEE, MMMM d, yyyy"),
                      wrap: true,
                      size: "sm",
                      color: "#666666",
                      flex: 4,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "Time",
                      color: "#aaaaaa",
                      size: "sm",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: `${slot.fromTime} - ${slot.toTime}`,
                      wrap: true,
                      color: "#666666",
                      size: "sm",
                      flex: 4,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "Room",
                      color: "#aaaaaa",
                      size: "sm",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: tenant.room.roomNumber,
                      wrap: true,
                      color: "#666666",
                      size: "sm",
                      flex: 4,
                    },
                  ],
                },
              ],
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "Thank you for your booking",
              wrap: true,
              color: "#aaaaaa",
              size: "xs",
              align: "center",
            },
          ],
        },
      },
    };

    try {
      const client = await getLineClient(landlordId);
      const lineRes = await client.pushMessage(lineUserId, message);
      if (!lineRes.ok) {
        console.error("Failed to send LINE message");
      }
    } catch (error) {
      console.error("Error sending LINE message:", error);
    }

    return NextResponse.json({ success: true, slot });
  } catch (error) {
    console.error("Error booking cleaning slot:", error);
    return NextResponse.json(
      { error: "Failed to book cleaning slot" },
      { status: 500 }
    );
  }
}
