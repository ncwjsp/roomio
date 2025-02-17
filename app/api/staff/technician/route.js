import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";

export async function GET(request) {
  try {
    await dbConnect();

    // Get landlordId from search params
    const { searchParams } = new URL(request.url);
    const landlordId = searchParams.get("landlordId");

    if (!landlordId) {
      return NextResponse.json(
        { error: "Landlord ID is required" },
        { status: 400 }
      );
    }

    const technicians = await Staff.find({
      landlordId,
      role: "Technician",
    }).sort({ createdAt: -1 });

    return NextResponse.json({ staff: technicians });
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return NextResponse.json(
      { error: "Failed to fetch technicians" },
      { status: 500 }
    );
  }
}
