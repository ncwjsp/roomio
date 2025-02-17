import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CleaningSchedule from "@/app/models/CleaningSchedule";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId");
    const landlordId = searchParams.get("landlordId");

    if (!buildingId) {
      return NextResponse.json(
        { error: "Building ID is required" },
        { status: 400 }
      );
    }

    console.log("Searching for schedules with:", {
      buildingId,
      landlordId,
    });

    const schedules = await CleaningSchedule.find({
      buildingId,
      landlordId,
    }).populate({
      path: "slots.bookedBy",
      model: Tenant,
      select: "name room",
      populate: {
        path: "room",
        model: Room,
        select: "roomNumber",
      },
    });

    console.log(
      "Schedules with populated data:",
      JSON.stringify(schedules, null, 2)
    );

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching cleaning schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch cleaning schedules" },
      { status: 500 }
    );
  }
}
