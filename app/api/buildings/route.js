import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";

export async function GET() {
  try {
    await dbConnect();
    const buildings = await Building.find({}).select("_id name");
    return NextResponse.json({ buildings });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch buildings" },
      { status: 500 }
    );
  }
}
