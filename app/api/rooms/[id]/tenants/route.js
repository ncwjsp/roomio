import dbConnect from "@/lib/mongodb";
import Room from "@/app/models/Room";
import Tenant from "@/app/models/Tenant";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const room = await Room.findOne({ 
      _id: id,
      landlordId: session.user.id 
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    const tenants = await Tenant.find({
      room: room._id,
      landlordId: session.user.id
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("Error fetching room tenants:", error);
    return NextResponse.json(
      { error: "Failed to fetch room tenants" },
      { status: 500 }
    );
  }
}
