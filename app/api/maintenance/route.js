import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/app/models/Maintenance";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Building from "@/app/models/Building";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");
    const landlordId = searchParams.get("landlordId");

    if (!lineUserId || !landlordId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const tenant = await Tenant.findOne({
      lineUserId,
      landlordId,
      active: true,
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tickets = await Maintenance.find({
      tenant: tenant._id,
    }).populate({
      path: "room",
      populate: [
        { path: "building", select: "name" },
        { path: "floor", select: "floorNumber" }
      ]
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching maintenance tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    const { problem, description, images, lineUserId, landlordId } = data;

    if (!lineUserId || !landlordId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get tenant details to get room information
    const tenant = await Tenant.findOne({
      lineUserId,
      landlordId,
      active: true,
    }).populate({
      path: "room",
      model: Room,
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Create maintenance request
    const maintenanceRequest = await Maintenance.create({
      tenant: tenant._id,
      room: tenant.room._id,
      problem,
      description,
      images: images?.map((url) => ({ url })) || [],
      currentStatus: "Pending",
      landlordId: landlordId,
      createdBy: tenant._id,
      statusHistory: [
        {
          status: "Pending",
          updatedBy: tenant._id,
          updatedByModel: "Tenant",
          comment: "Initial request created",
          updatedAt: new Date(),
        },
      ],
    });

    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance request:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance request" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { id, updates } = body;

    const updatedRequest = await Maintenance.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedRequest) {
      return new Response(
        JSON.stringify({ message: "Maintenance request not found" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(updatedRequest), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Failed to update maintenance request",
        error,
      }),
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { ids } = body;

    await Maintenance.deleteMany({ _id: { $in: ids } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Failed to delete maintenance requests",
        error,
      }),
      {
        status: 500,
      }
    );
  }
}
