import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";
import User from "@/app/models/User";
import { getLineClient } from "@/lib/line";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const query = {
      landlordId: session.user.id,
      ...(role && { role }),
    };

    const staff = await Staff.find(query).sort({ createdAt: -1 });
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();

    const staff = new Staff({
      ...data,
      landlordId: session.user.id,
    });

    await staff.save();

    // If staff has lineUserId, handle LINE setup
    if (
      ["Housekeeper", "Technician"].includes(staff.role) &&
      staff.lineUserId
    ) {
      try {
        // Get LINE client and user config
        const user = await User.findById(session.user.id);
        const client = await getLineClient(session.user.id);

        // Get the appropriate rich menu ID
        const richMenuId = user.lineConfig?.staffRichMenuId;

        if (richMenuId) {
          await client.linkRichMenuToUser(staff.lineUserId, richMenuId);
        }

        // Send welcome message
        await client.pushMessage(staff.lineUserId, {
          type: "text",
          text: `Welcome ${
            staff.firstName
          }! You have been registered as a ${staff.role.toLowerCase()}. Please use the menu below to manage your tasks.`,
        });
      } catch (error) {
        console.error("Error with LINE operations:", error);
      }
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error in staff creation:", error);
    return NextResponse.json(
      { error: "Failed to add staff member", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    const { id, updates } = data;

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

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    const { ids } = data;

    const result = await Staff.deleteMany({
      _id: { $in: ids },
      landlordId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No staff members found to delete" },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete staff members" },
      { status: 500 }
    );
  }
}
