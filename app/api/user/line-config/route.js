import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import User from "@/app/models/User";
import Tenant from "@/app/models/Tenant";
import dbConnect from "@/lib/mongodb";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");
    const feature = searchParams.get("feature");

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ publicId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If requesting specific feature's LIFF ID
    if (feature) {
      const liffId = user.lineConfig?.liffIds?.[feature] || "";
      return NextResponse.json({ liffId });
    }

    // Return full LINE configuration
    return NextResponse.json({ lineConfig: user.lineConfig });
  } catch (error) {
    console.error("Error fetching LINE config:", error);
    return NextResponse.json(
      { error: "Failed to fetch LINE configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lineConfig } = await request.json();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { lineConfig },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ lineConfig: updatedUser.lineConfig });
  } catch (error) {
    console.error("Error updating LINE config:", error);
    return NextResponse.json(
      { error: "Failed to update LINE configuration" },
      { status: 500 }
    );
  }
}
