import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Announcement from "@/app/models/Announcement";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineId");
    const landlordId = searchParams.get("landlordId");

    if (!lineUserId || !landlordId) {
      return NextResponse.json(
        { error: "LINE user ID and landlord ID are required" },
        { status: 400 }
      );
    }

    // Find tenant by LINE user ID and landlordId
    const tenant = await Tenant.findOne({
      lineUserId,
      landlordId,
    });

    if (!tenant) {
      console.log("No tenant found for LINE user ID:", lineUserId);
      return NextResponse.json({ announcements: [] });
    }

    // Get all announcements for this tenant's landlord
    const announcements = await Announcement.find({
      createdBy: tenant.landlordId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
