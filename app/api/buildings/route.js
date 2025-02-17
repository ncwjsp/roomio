import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get the ID from the URL query parameter as fallback
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {  
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const buildings = await Building.find({
      createdBy: userId, // Use the ID from query parameter
    }).sort({ name: 1 });

    console.log("Found buildings for user:", buildings);

    return NextResponse.json({ buildings });
  } catch (error) {
    console.error("Error fetching buildings:", error);
    return NextResponse.json(
      { error: "Failed to fetch buildings" },
      { status: 500 }
    );
  }
}
