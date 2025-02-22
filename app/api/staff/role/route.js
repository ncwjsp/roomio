import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");

    if (!lineUserId) {
      return NextResponse.json({ error: "Line User ID is required" }, { status: 400 });
    }

    const staff = await Staff.findOne({ lineUserId }).select('role');
    
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ role: staff.role });
  } catch (error) {
    console.error("Error fetching staff role:", error);
    return NextResponse.json({ error: "Failed to fetch staff role" }, { status: 500 });
  }
}
