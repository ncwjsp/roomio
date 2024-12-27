import dbConnect from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import Friend from "@/app/models/Friend";

export async function GET(req) {
  try {
    await dbConnect();

    const friends = await Friend.find({ isTenant: false });

    return NextResponse.json({ friends }, { status: 200 });
  } catch (error) {
    console.error("Error fetching line friends:", error);
    return NextResponse.json(
      { message: "Error fetching line friends" },
      { status: 500 }
    );
  }
}
