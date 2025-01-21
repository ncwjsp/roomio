import dbConnect from "@/lib/mongodb";
import Parcel from "@/app/models/Parcel";
import Room from "@/app/models/Room";
import Tenant from "@/app/models/Tenant";
import Floor from "@/app/models/Floor";
import Building from "@/app/models/Building";
import { NextResponse } from "next/server";
import { Client } from "@line/bot-sdk";
import User from "@/app/models/User";

// Configure LINE client
const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new Client(lineConfig);

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");
    const landlordPublicId = searchParams.get("landlordPublicId");
    const landlordId = searchParams.get("landlordId");

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
    if (lineUserId && landlordPublicId) {
      const landlord = await User.findOne({ publicId: landlordPublicId });
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
        tenant: tenant._id, // Using 'tenant' instead of 'tenantId'
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
      { error: "Failed to fetch parcels: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Received parcel data:", body);

    if (!body.landlordId) {
      return NextResponse.json(
        { error: "landlordId is required" },
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

    const populatedParcel = await Parcel.findById(parcel._id)
      .populate({
        path: "tenant",
        select: "name email phone",
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
      { status: 500 }
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
