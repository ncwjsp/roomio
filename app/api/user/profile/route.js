import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/app/models/User";

// GET endpoint to fetch user profile
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    console.log("Fetching profile for user ID:", id); // Debug log

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    };


    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: `Failed to fetch user profile: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT endpoint to update user profile
export async function PUT(request) {
  try {
    await dbConnect();

    const { id, firstName, lastName, email } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find user and update
    const user = await User.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        email,
      },
      { new: true, runValidators: true }
    ).select("firstName lastName email");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
