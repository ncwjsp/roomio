import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/app/models/Maintenance";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sendMaintenanceNotification } from "@/lib/notifications";
import LineContact from "@/app/models/LineContact";

export async function PUT(request, context) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { status, comment } = await request.json();
    const params = await context.params;

    const maintenance = await Maintenance.findById(params.id).populate([
      {
        path: "room",
        populate: [
          {
            path: "floor",
            populate: {
              path: "building",
              select: "name"
            }
          },
          {
            path: "tenant",
            select: "name lineUserId"
          },
          {
            path: "createdBy",
            select: "lineConfig"
          }
        ]
      }
    ]);

    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance request not found" },
        { status: 404 }
      );
    }

    maintenance.statusHistory.push({
      status,
      comment: comment || `Status updated to ${status}`,
      updatedAt: new Date(),
      updatedByModel: "User",
      updatedBy: session.user.id
    });

    maintenance.currentStatus = status;
    await maintenance.save();

    // Send notification to tenant (but don't fail if it doesn't work)
    try {
      if (maintenance.room?.tenant?.lineUserId) {
        // Skip if lineUserId looks like a MongoDB ObjectId (24 hex chars)
        if (maintenance.room.tenant.lineUserId.match(/^[0-9a-fA-F]{24}$/)) {
          console.log("Skipping notification - lineUserId appears to be a MongoDB ObjectId, not a LINE ID");
        } else {
          const notificationMessage = comment || `Your maintenance request has been updated to ${status.toLowerCase()}`;
          
          await sendMaintenanceNotification({
            userId: maintenance.room.tenant.lineUserId,
            maintenance,
            status,
            comment: notificationMessage
          });
          console.log("Successfully sent notification to tenant with LINE ID:", maintenance.room.tenant.lineUserId);
        }
      }
    } catch (error) {
      console.error("Failed to send notification to tenant:", error.message);
      // Continue with the request even if notification fails
    }

    return NextResponse.json({ success: true, maintenance });
  } catch (error) {
    console.error("Error updating maintenance status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update maintenance status" },
      { status: 500 }
    );
  }
}
