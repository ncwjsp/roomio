import dbConnect from "@/lib/mongodb";
import Parcel from "@/app/models/Parcel";
import Room from "@/app/models/Room";
import Tenant from "@/app/models/Tenant";
import Floor from "@/app/models/Floor";
import Building from "@/app/models/Building";
import { NextResponse } from "next/server";
import { Client } from "@line/bot-sdk";
import User from "@/app/models/User";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");
    const landlordId = searchParams.get("landlordId");

    console.log("lineUserId:", lineUserId);
    console.log("landlordId:", landlordId);

    // Admin panel request
    if (landlordId) {
      console.log("Fetching parcels for landlordId:", landlordId);
      const parcels = await Parcel.find({ landlordId })
        .populate("tenant", "name email phone") // Using 'tenant' instead of 'tenantId'
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

      console.log("Found parcels:", parcels.length);
      return NextResponse.json(parcels);
    }

    // LINE app request
    if (lineUserId && landlordId) {
      const landlord = await User.findById(landlordId);
      if (!landlord) {
        return NextResponse.json(
          { error: "Landlord not found" },
          { status: 404 }
        );
      }

      const tenant = await Tenant.findOne({
        lineUserId: lineUserId,
        landlordId: landlord._id,
      });

      if (!tenant) {
        return NextResponse.json(
          { error: "Tenant not found" },
          { status: 404 }
        );
      }

      const parcels = await Parcel.find({
        tenant: tenant._id,
        landlordId: landlord._id,
      }).sort({ createdAt: -1 });

      return NextResponse.json({ parcels });
    }

    return NextResponse.json(
      { error: "Invalid request parameters" },
      { status: 400 }
    );
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
    const body = await request.json();
    console.log("Received parcel data:", body);

    if (!body.landlordId) {
      return NextResponse.json(
        { error: "landlordId is required" },
        { status: 400 }
      );
    }

    // Get landlord's LINE configuration
    const landlord = await User.findById(body.landlordId);
    if (
      !landlord?.lineConfig?.channelAccessToken ||
      !landlord?.lineConfig?.channelSecret
    ) {
      console.log("LINE configuration not found for landlord");
      return NextResponse.json(
        { error: "LINE configuration not found" },
        { status: 400 }
      );
    }

    // Configure LINE client with landlord's credentials
    const lineConfig = {
      channelAccessToken: landlord.lineConfig.channelAccessToken,
      channelSecret: landlord.lineConfig.channelSecret,
    };
    const client = new Client(lineConfig);

    // Check for duplicate tracking number
    const existingParcel = await Parcel.findOne({
      trackingNumber: body.trackingNumber,
      landlordId: body.landlordId,
    });

    if (existingParcel) {
      return NextResponse.json(
        {
          error: `Parcel with tracking number ${body.trackingNumber} already exists`,
        },
        { status: 400 }
      );
    }

    const parcel = await Parcel.create({
      tenant: body.tenant,
      landlordId: body.landlordId,
      room: body.room,
      recipient: body.recipient,
      trackingNumber: body.trackingNumber,
      status: body.status || "uncollected",
    });

    // Fetch tenant details with populated data
    const tenant = await Tenant.findById(body.tenant).populate({
      path: "room",
      populate: {
        path: "floor",
        populate: {
          path: "building",
        },
      },
    });

    if (tenant?.lineUserId) {
      try {
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
              backgroundColor: "#3b82f6",
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
                      text: "Name",
                      size: "sm",
                      color: "#8C8C8C",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: tenant.name || "N/A",
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
                      text: tenant.room?.roomNumber || "N/A",
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
                      text: tenant.room?.floor?.building?.name || "N/A",
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
                      text: body.trackingNumber || "N/A",
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

        console.log("Sending LINE notification to:", tenant.lineUserId);
        console.log("Message payload:", JSON.stringify(message, null, 2));

        await client.pushMessage(tenant.lineUserId, message);
        console.log("LINE notification sent successfully");
      } catch (lineError) {
        console.error("Failed to send LINE notification:", lineError);
        if (lineError.response?.data) {
          console.error("LINE API Error details:", lineError.response.data);
        }
        console.error("Error message:", lineError.message);
        console.error("Full error object:", JSON.stringify(lineError, null, 2));
      }
    } else {
      console.log("No LINE userId found for tenant:", tenant?._id);
    }

    // Return populated parcel data
    const populatedParcel = await Parcel.findById(parcel._id)
      .populate({
        path: "tenant",
        select: "name email phone lineUserId",
      })
      .populate({
        path: "room",
        populate: {
          path: "floor",
          populate: {
            path: "building",
          },
        },
      });

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
    console.log("Updating parcel:", body);

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
