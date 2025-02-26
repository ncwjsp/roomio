import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";
import Building from "@/app/models/Building";

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");

    if (!lineUserId) {
      return NextResponse.json(
        { error: "Line User ID is required" },
        { status: 400 }
      );
    }

    // Find staff and populate their assigned buildings
    const staff = await Staff.findOne({ lineUserId })
      .populate('assignedBuildings', '_id name address');
    
    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    // For debugging
    console.log("Buildings found:", {
      staffId: staff._id,
      lineUserId: staff.lineUserId,
      role: staff.role,
      buildingsCount: staff.assignedBuildings?.length,
      buildings: staff.assignedBuildings
    });
    
    return NextResponse.json({
      success: true,
      buildings: staff.assignedBuildings || [],
      debug: {
        staffId: staff._id,
        buildingsCount: staff.assignedBuildings?.length
      }
    });
  } catch (error) {
    console.error("Error fetching buildings:", error);
    return NextResponse.json(
      { error: "Failed to fetch buildings" },
      { status: 500 }
    );
  }
}
