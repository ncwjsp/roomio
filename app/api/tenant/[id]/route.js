import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import LineContact from "@/app/models/LineContact";
import { getLineClient } from "@/lib/line";

// Get single tenant
export async function GET(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const params = await context.params;
    const tenantId = params.id;

    const tenant = await Tenant.findById(tenantId).populate({
      path: "room",
      populate: {
        path: "floor",
        populate: {
          path: "building",
          select: "name createdBy",
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify ownership
    if (
      tenant.room?.floor?.building?.createdBy?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenant" },
      { status: 500 }
    );
  }
}

// Update tenant
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const updates = await request.json();

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

    // Update only allowed fields
    const allowedUpdates = [
      "name",
      "email",
      "phone",
      "lineId",
      "depositAmount",
      "leaseStartDate",
      "leaseEndDate",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        tenant[field] = updates[field];
      }
    });

    await tenant.save();

    // Return updated tenant with populated fields
    const updatedTenant = await Tenant.findById(params.id).populate({
      path: "room",
      populate: {
        path: "floor",
        populate: {
          path: "building",
        },
      },
    });

    return NextResponse.json({ tenant: updatedTenant });
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json(
      { error: "Failed to update tenant" },
      { status: 500 }
    );
  }
}

// Delete tenant
export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const params = await context.params;
    const tenantId = params.id;

    // Find tenant and populate room details
    const tenant = await Tenant.findById(tenantId).populate({
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
    if (
      tenant.room?.floor?.building?.createdBy?.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update room status
    await Room.findByIdAndUpdate(tenant.room._id, {
      tenant: null,
      status: "Available",
    });

    // Update LINE contact
    const lineContact = await LineContact.findOne({
      userId: tenant.lineUserId,
    });
    if (lineContact) {
      await LineContact.findByIdAndUpdate(lineContact._id, {
        isTenant: false,
        tenantId: null,
      });

      // Get LINE client for this user and handle LINE operations
      try {
        const client = await getLineClient(session.user.id);
        await client.unlinkRichMenuFromUser(tenant.lineUserId);

        const goodbyeMessage = {
          type: "text",
          text: `Thank you for staying with us, ${tenant.name}. We hope to see you again!`,
        };

        await client.pushMessage(tenant.lineUserId, goodbyeMessage);
      } catch (lineError) {
        console.error("Error with LINE operations:", lineError);
        // Continue with tenant deletion even if LINE operations fail
      }
    }

    // Delete tenant
    await Tenant.findByIdAndDelete(tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json(
      { error: "Failed to delete tenant" },
      { status: 500 }
    );
  }
}
