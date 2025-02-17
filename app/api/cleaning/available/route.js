import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CleaningSchedule from "@/app/models/CleaningSchedule";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");
    const landlordId = searchParams.get("landlordId");
    const buildingId = searchParams.get("buildingId");

    if (!lineUserId || !landlordId || !buildingId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Find schedules for the specific building
    const schedules = await CleaningSchedule.find({
      landlordId,
      buildingId,
      // Only get schedules for current and future months
      month: {
        $gte: new Date().toISOString().slice(0, 7), // Format: YYYY-MM
      },
    }).sort({ month: 1 });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching cleaning schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch cleaning schedules" },
      { status: 500 }
    );
  }
}
