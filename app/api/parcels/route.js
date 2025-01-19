import dbConnect from "@/lib/mongodb";
import Parcel from "@/app/models/Parcel";
import Room from "@/app/models/Room";
import Tenant from "@/app/models/Tenant";
import Floor from "@/app/models/Floor";
import Building from "@/app/models/Building";
import { NextResponse } from "next/server";
import { Client } from "@line/bot-sdk";

// Configure LINE client
const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new Client(lineConfig);

export async function GET() {
  try {
    await dbConnect();
    const parcels = await Parcel.find({})
      .populate({
        path: "room",
        populate: {
          path: "floor",
          populate: {
            path: "building",
          },
        },
      })
      .populate("tenant")
      .sort({ createdAt: -1 });
    return NextResponse.json(parcels);
  } catch (error) {
    console.error("Error fetching parcels:", error);
    return NextResponse.json(
      { error: "Failed to fetch parcels" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await dbConnect();

    // Find the room and tenant
    const room = await Room.findById(body.room);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const tenant = await Tenant.findById(body.tenant);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Create new parcel with required fields
    const parcelData = {
      room: room._id,
      tenant: tenant._id,
      recipient: body.recipient,
      trackingNumber: body.trackingNumber,
      status: "uncollected",
    };

    const newParcel = new Parcel(parcelData);
    await newParcel.save();

    // Send LINE notification if tenant has lineUserId
    if (tenant.lineUserId) {
      try {
        await client.pushMessage(tenant.lineUserId, {
          type: "text",
          text: `📦 You have a new parcel!\n\nTracking Number: ${body.trackingNumber}\nRoom: ${room.roomNumber}\n\nPlease collect it from the office during business hours.`,
        });
        console.log("LINE notification sent successfully");
      } catch (lineError) {
        console.error("Error sending LINE notification:", lineError);
        // Continue execution even if LINE notification fails
      }
    }

    // Populate the saved parcel with all references
    const populatedParcel = await Parcel.findById(newParcel._id)
      .populate({
        path: "room",
        populate: {
          path: "floor",
          populate: {
            path: "building",
          },
        },
      })
      .populate("tenant");

    return NextResponse.json(populatedParcel, { status: 201 });
  } catch (error) {
    console.error("Error adding parcel:", error);
    return NextResponse.json(
      { error: "Failed to add parcel: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    await dbConnect();

    const { trackingNumber, updates } = body;
    const updatedParcel = await Parcel.findOneAndUpdate(
      { trackingNumber },
      updates,
      { new: true }
    )
      .populate({
        path: "room",
        populate: {
          path: "floor",
          populate: {
            path: "building",
          },
        },
      })
      .populate("tenant");

    if (!updatedParcel) {
      return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
    }

    return NextResponse.json(updatedParcel);
  } catch (error) {
    console.error("Error updating parcel:", error);
    return NextResponse.json(
      { error: "Failed to update parcel" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    await dbConnect();

    const { trackingNumbers } = body;
    await Parcel.deleteMany({ trackingNumber: { $in: trackingNumbers } });

    return NextResponse.json({ message: "Parcels deleted successfully" });
  } catch (error) {
    console.error("Error deleting parcels:", error);
    return NextResponse.json(
      { error: "Failed to delete parcels" },
      { status: 500 }
    );
  }
}
