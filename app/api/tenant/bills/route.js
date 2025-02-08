import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import Tenant from "@/app/models/Tenant";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get tenant's room
    const tenant = await Tenant.findOne({ userId: session.user.id });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get bills for tenant's room
    const bills = await Bill.find({ roomId: tenant.roomId })
      .populate({
        path: "roomId",
        select: "roomNumber floor",
        populate: {
          path: "floor",
          select: "building",
          populate: {
            path: "building",
            select: "name",
          },
        },
      })
      .sort({ month: -1 });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching tenant bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}
