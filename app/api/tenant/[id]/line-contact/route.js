import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { lineId } = await request.json();

    const tenant = await Tenant.findById(params.id).populate({
      path: "room",
      populate: {
        path: "floor",
        populate: {
          path: "building",
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify ownership
    if (tenant.room.floor.building.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    tenant.lineId = lineId;
    await tenant.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating LINE contact:", error);
    return NextResponse.json(
      { error: "Failed to update LINE contact" },
      { status: 500 }
    );
  }
}
