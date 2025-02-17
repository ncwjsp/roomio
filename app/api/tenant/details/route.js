import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");
    const landlordId = searchParams.get("landlordId");

    console.log("Searching for tenant with:", { lineUserId, landlordId });

    if (!lineUserId || !landlordId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Find the tenant with room and building details
    const tenant = await Tenant.findOne({
      lineUserId,
      landlordId: new mongoose.Types.ObjectId(landlordId),
    }).populate({
      path: "room",
      select: "roomNumber building",
      populate: {
        path: "building",
        select: "name",
      },
    });

    console.log("Found tenant:", tenant);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found with provided LINE ID and landlord" },
        { status: 404 }
      );
    }

    if (!tenant.room) {
      return NextResponse.json(
        { error: "Tenant has no assigned room" },
        { status: 404 }
      );
    }

    // Format the response based on the actual data structure
    const formattedTenant = {
      _id: tenant._id,
      name: tenant.name,
      room: {
        _id: tenant.room._id,
        roomNumber: tenant.room.roomNumber,
        buildingId: tenant.room.building?._id,
        building: tenant.room.building?.name,
      },
    };

    return NextResponse.json({ tenant: formattedTenant });
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tenant details",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
