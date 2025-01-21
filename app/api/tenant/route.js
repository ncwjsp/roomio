import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";
import LineContact from "@/app/models/LineContact";

export async function POST(request) {
  try {
    const body = await request.json();
    await dbConnect();

    console.log("Received body:", body); // Debug log

    // Find the LINE contact
    const lineContact = await LineContact.findOne({ userId: body.lineUserId });
    console.log("Found LINE contact:", lineContact); // Debug log

    if (!lineContact) {
      console.log("No LINE contact found for userId:", body.lineUserId); // Debug log
      return NextResponse.json(
        {
          error: "LINE contact not found",
          receivedId: body.lineUserId,
          body: body, // Include the full body for debugging
        },
        { status: 404 }
      );
    }

    // Validate required fields
    const requiredFields = [
      "name",
      "email",
      "phone",
      "lineId",
      "room",
      "depositAmount",
      "leaseStartDate",
      "leaseEndDate",
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missingFields,
        },
        { status: 400 }
      );
    }

    // Create new tenant with LINE user ID and landlordId
    const tenantData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      lineId: body.lineId,
      lineUserId: lineContact.userId,
      room: body.room,
      depositAmount: body.depositAmount,
      leaseStartDate: body.leaseStartDate,
      leaseEndDate: body.leaseEndDate,
      pfp: body.pfp || lineContact.pfp,
      landlordId: body.owner,
    };

    console.log("Creating tenant with data:", tenantData); // Debug log

    // Verify room exists and is available
    const room = await Room.findById(body.room);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Create tenant
    const newTenant = new Tenant(tenantData);
    await newTenant.save();

    // Update the LINE contact
    await LineContact.findByIdAndUpdate(lineContact._id, {
      isTenant: true,
      tenantId: newTenant._id,
    });

    // Update room with new tenant and status
    await Room.findByIdAndUpdate(body.room, {
      tenant: newTenant._id,
      status: "Occupied", // Update room status to Occupied
    });

    // Populate and return
    const populatedTenant = await Tenant.findById(newTenant._id).populate({
      path: "room",
      populate: {
        path: "floor",
        populate: {
          path: "building",
        },
      },
    });

    return NextResponse.json(populatedTenant, { status: 201 });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json(
      {
        error: "Failed to create tenant",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    const query = userId ? { owner: userId } : {};

    const tenants = await Tenant.find(query).populate({
      path: "room",
      populate: {
        path: "floor",
        populate: {
          path: "building",
          select: "name",
        },
      },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}
