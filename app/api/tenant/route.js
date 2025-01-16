import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Create the tenant with owner
    const tenant = await Tenant.create({
      ...data,
      owner: session.user.id, // Changed from userId to owner
    });

    // Update room status
    await Room.findByIdAndUpdate(data.room, {
      status: "Occupied",
      tenant: tenant._id,
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    console.error("Error in tenant API:", error);
    return NextResponse.json(
      { message: "Failed to create tenant", error: error.message },
      { status: 500 }
    );
  }
}

// Get all tenants for the current user
export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tenants = await Tenant.find({ owner: session.user.id })
      .populate("room")
      .sort({ createdAt: -1 });

    return NextResponse.json({ tenants }, { status: 200 });
  } catch (error) {
    console.error("Error in tenant API:", error);
    return NextResponse.json(
      { message: "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}
