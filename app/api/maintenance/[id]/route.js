import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/app/models/Maintenance";
import Room from "@/app/models/Room";
import Building from "@/app/models/Building";
import Floor from "@/app/models/Floor";
import Staff from "@/app/models/Staff";
import Tenant from "@/app/models/Tenant";

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const data = await params;

    const ticket = await Maintenance.findById(data.id)
      .populate([
        {
          path: "room",
          model: Room,
          populate: {
            path: "floor",
            model: Floor,
            populate: {
              path: "building",
              model: Building,
            },
          },
        },
        {
          path: "staff",
          model: Staff,
          select: "firstName lastName specialization",
        },
        {
          path: "tenant",
          model: Tenant,
          select: "name lineUserId",
        },
      ]);

    if (!ticket) {
      return NextResponse.json(
        { error: "Maintenance ticket not found" },
        { status: 404 }
      );
    }


    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error fetching maintenance ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance ticket" },
      { status: 500 }
    );
  }
}
