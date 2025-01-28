import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Parcel from "@/app/models/Parcel";
import Room from "@/app/models/Room";
import Floor from "@/app/models/Floor";
import Building from "@/app/models/Building";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineId");

    console.log("Searching for tenant with lineUserId:", lineUserId);

    if (!lineUserId) {
      return NextResponse.json(
        { error: "LINE user ID is required" },
        { status: 400 }
      );
    }

    // Find tenant by LINE user ID
    const tenant = await Tenant.findOne({ lineUserId });
    console.log("Found tenant:", tenant); // Debug log

    if (!tenant) {
      console.log("No tenant found for LINE user ID:", lineUserId);
      return NextResponse.json({ parcels: [] });
    }

    // Get all parcels for this tenant
    const parcels = await Parcel.find({
      tenant: tenant._id,
    })
      .populate({
        path: "room",
        populate: {
          path: "floor",
          populate: {
            path: "building",
          },
        },
      })
      .sort({ createdAt: -1 }); // Most recent first

    return NextResponse.json({ parcels });
  } catch (error) {
    console.error("Error fetching parcels:", error);
    return NextResponse.json(
      { error: "Failed to fetch parcels" },
      { status: 500 }
    );
  }
}
