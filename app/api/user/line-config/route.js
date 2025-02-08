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
    const userId = searchParams.get("id");
    const feature = searchParams.get("feature");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).select("lineConfig");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Found user config:", {
      userId,
      feature,
      lineConfig: user.lineConfig,
      liffId: user.lineConfig?.liffIds?.[feature],
    });

    // Verify the specific LIFF ID exists based on the feature
    if (feature && !user.lineConfig?.liffIds?.[feature]) {
      return NextResponse.json(
        { error: `${feature} LIFF ID not configured for this user` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      lineConfig: {
        ...user.lineConfig,
        maintenanceLiffId: user.lineConfig?.liffIds?.maintenance,
        // Add other specific LIFF IDs as needed
        parcelsLiffId: user.lineConfig?.liffIds?.parcels,
        reportsLiffId: user.lineConfig?.liffIds?.reports,
        billingLiffId: user.lineConfig?.liffIds?.billing,
        cleaningLiffId: user.lineConfig?.liffIds?.cleaning,
        announcementLiffId: user.lineConfig?.liffIds?.announcement,
        scheduleLiffId: user.lineConfig?.liffIds?.schedule,
        tasksLiffId: user.lineConfig?.liffIds?.tasks,
      },
    });
  } catch (error) {
    console.error("Error fetching line config:", error);
    return NextResponse.json(
      { error: "Failed to fetch line config" },
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
