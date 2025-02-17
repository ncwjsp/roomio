import dbConnect from "@/lib/mongodb";
import Parcel from "@/app/models/Parcel";
import Room from "@/app/models/Room";
import Tenant from "@/app/models/Tenant";
import Floor from "@/app/models/Floor";
import Building from "@/app/models/Building";
import { NextResponse } from "next/server";
import { Client } from "@line/bot-sdk";
import User from "@/app/models/User";
import { getLineClient } from "@/lib/line";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const parcels = await Parcel.find({ landlordId: session.user.id })
      .populate("tenant", "name email phone")
      .populate({
        path: "room",
        populate: {
          path: "floor",
          populate: {
            path: "building",
          },
        },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ parcels });
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
    await dbConnect();

    const parcelData = await request.json();
    // Get the room and its tenant
    const room = await Room.findById(parcelData.room).populate("tenant");
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Create new parcel
    const parcel = new Parcel({
      room: room._id,
      tenant: room.tenant._id,
      recipient: parcelData.recipient,
      trackingNumber: parcelData.trackingNumber,
      status: "uncollected",
      landlordId: room.tenant.landlordId, // Add landlordId from tenant
    });
    const savedParcel = await parcel.save();

    // Get populated room data for the notification
    const populatedRoom = await Room.findById(room._id)
      .populate({
        path: "floor",
        populate: {
          path: "building",
        },
      });

    // Send LINE notification if tenant has LINE userId
    if (room.tenant?.lineUserId) {
      try {
        const client = await getLineClient(room.tenant.landlordId);
        const message = {
          type: "flex",
          altText: "New Parcel Arrived",
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "📦 NEW PARCEL ARRIVED",
                      color: "#ffffff",
                      size: "lg",
                      flex: 4,
                      weight: "bold",
                      align: "center",
                    },
                  ],
                },
              ],
              paddingAll: "20px",
              backgroundColor: "#898F63",
              spacing: "md",
              height: "60px",
              paddingTop: "22px",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "Recipient",
                      size: "sm",
                      color: "#8C8C8C",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: parcelData.recipient || "N/A",
                      size: "sm",
                      color: "#000000",
                      flex: 2,
                      wrap: true,
                    },
                  ],
                  spacing: "md",
                  paddingAll: "12px",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "Room",
                      size: "sm",
                      color: "#8C8C8C",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: populatedRoom.roomNumber || "N/A",
                      size: "sm",
                      color: "#000000",
                      flex: 2,
                      wrap: true,
                    },
                  ],
                  spacing: "md",
                  paddingAll: "12px",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "Building",
                      size: "sm",
                      color: "#8C8C8C",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: populatedRoom.floor?.building?.name || "N/A",
                      size: "sm",
                      color: "#000000",
                      flex: 2,
                      wrap: true,
                    },
                  ],
                  spacing: "md",
                  paddingAll: "12px",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "Tracking",
                      size: "sm",
                      color: "#8C8C8C",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: parcelData.trackingNumber || "N/A",
                      size: "sm",
                      color: "#000000",
                      flex: 2,
                      wrap: true,
                    },
                  ],
                  spacing: "md",
                  paddingAll: "12px",
                },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "Please collect your parcel at the office",
                  color: "#8C8C8C",
                  size: "xs",
                  align: "center",
                  wrap: true,
                },
              ],
              paddingAll: "20px",
            },
            styles: {
              footer: {
                separator: true,
              },
            },
          },
        };

        console.log("Sending LINE notification to:", room.tenant.lineUserId);
        await client.pushMessage(room.tenant.lineUserId, message);
        console.log("LINE notification sent successfully");
      } catch (lineError) {
        console.error("Failed to send LINE notification:", lineError);
        if (lineError.response?.data) {
          console.error("LINE API Error details:", lineError.response.data);
        }
      }
    }

    // Populate the saved parcel for response
    const populatedParcel = await Parcel.findById(savedParcel._id)
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
      { status: 400 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    if (!body.trackingNumber) {
      return NextResponse.json(
        { error: "Tracking number is required" },
        { status: 400 }
      );
    }

    const updatedParcel = await Parcel.findOneAndUpdate(
      { trackingNumber: body.trackingNumber },
      body.updates,
      { new: true }
    )
      .populate("tenant", "name email phone")
      .populate({
        path: "room",
        populate: {
          path: "floor",
          populate: {
            path: "building",
          },
        },
      });

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
    console.log("Deleting parcels:", body);

    if (!body.trackingNumbers || !body.trackingNumbers.length) {
      return NextResponse.json(
        { error: "Tracking numbers are required" },
        { status: 400 }
      );
    }

    const result = await Parcel.deleteMany({
      trackingNumber: { $in: body.trackingNumbers },
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No parcels found to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Successfully deleted ${result.deletedCount} parcels`,
    });
  } catch (error) {
    console.error("Error deleting parcels:", error);
    return NextResponse.json(
      { error: "Failed to delete parcels" },
      { status: 500 }
    );
  }
}
