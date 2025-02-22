import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/app/models/Settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await Settings.findOne({ createdBy: session.user.id });
    
    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        billingCycle: {
          startDate: 1,
          endDate: 28,
          dueDate: 5,
        }
      });
    }

    return NextResponse.json({ billingCycle: settings.billingCycle });
  } catch (error) {
    console.error("Error fetching billing cycle:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing cycle" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billingCycle = await request.json();

    // Validate billing cycle dates
    if (billingCycle.startDate < 1 || billingCycle.startDate > 28) {
      return NextResponse.json(
        { error: "Start date must be between 1 and 28" },
        { status: 400 }
      );
    }

    if (billingCycle.endDate < 1 || billingCycle.endDate > 28) {
      return NextResponse.json(
        { error: "End date must be between 1 and 28" },
        { status: 400 }
      );
    }

    if (billingCycle.dueDate < 1 || billingCycle.dueDate > 31) {
      return NextResponse.json(
        { error: "Due date must be between 1 and 31" },
        { status: 400 }
      );
    }

    // Update or create settings
    const settings = await Settings.findOneAndUpdate(
      { createdBy: session.user.id },
      { 
        createdBy: session.user.id,
        billingCycle 
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ billingCycle: settings.billingCycle });
  } catch (error) {
    console.error("Error updating billing cycle:", error);
    return NextResponse.json(
      { error: "Failed to update billing cycle" },
      { status: 500 }
    );
  }
}
