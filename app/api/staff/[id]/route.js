import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";
import User from "@/app/models/User";
import { getLineClient } from "@/lib/line";

export async function PUT(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const params = await context.params;
    const id = params.id;
    const updates = await request.json();

    const staff = await Staff.findOneAndUpdate(
      { _id: id, landlordId: session.user.id },
      updates,
      { new: true }
    );

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const params = await context.params;
    const id = params.id;

    // Get staff details before deletion
    const staff = await Staff.findOne({
      _id: id,
      landlordId: session.user.id,
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // If staff has LINE user ID, handle LINE-related cleanup
    if (staff.lineUserId) {
      try {
        // Get LINE client
        const user = await User.findById(session.user.id);
        const client = await getLineClient(session.user.id);

        // Unlink rich menu
        await client.unlinkRichMenuFromUser(staff.lineUserId);

        // Send goodbye message
        await client.pushMessage(staff.lineUserId, {
          type: "text",
          text: `Goodbye ${staff.firstName}. Thank you for your service.`,
        });
      } catch (error) {
        console.error("Error with LINE operations:", error);
        // Continue with deletion even if LINE operations fail
      }
    }

    // Delete the staff member
    await Staff.findOneAndDelete({
      _id: id,
      landlordId: session.user.id,
    });

    return NextResponse.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}
