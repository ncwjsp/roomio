import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/app/models/Maintenance";
import Room from "@/app/models/Room";
import Tenant from "@/app/models/Tenant";

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const data = await params;

    const ticket = await Maintenance.findById(data.id)
      .populate([
        {
          path: "room",
          populate: {
            path: "floor",
            populate: {
              path: "building",
            },
          },
        },
        {
          path: "staff",
          select: "firstName lastName specialization",
        },
        {
          path: "tenant",
          select: "name lineUserId",
        },
      ]);

    if (!ticket) {
      return NextResponse.json(
        { error: "Maintenance ticket not found" },
        { status: 404 }
      );
    }

    console.log("Fetched ticket:", ticket); 
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error fetching maintenance ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance ticket" },
      { status: 500 }
    );
  }
}
