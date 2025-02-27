import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/app/models/Maintenance";
import Staff from "@/app/models/Staff";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sendMaintenanceNotification } from "@/lib/notifications";
import { format } from "date-fns";
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

    const { technicianId, scheduledDate, assignedAt } = await request.json();

    if (!technicianId || !scheduledDate) {
      return NextResponse.json(
        { error: "Technician ID and scheduled date are required" },
        { status: 400 }
      );
    }

    const params = await context.params;

    // Find the maintenance ticket first
    const existingTicket = await Maintenance.findById(params.id).populate([
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

    if (!existingTicket) {
      return NextResponse.json(
        { error: "Maintenance ticket not found" },
        { status: 404 }
      );
    }

    // Check if trying to assign to the same technician
    if (existingTicket.staff?.toString() === technicianId) {
      return NextResponse.json(
        { error: "This technician is already assigned to this ticket" },
        { status: 400 }
      );
    }

    // Find the staff member
    const staff = await Staff.findById(technicianId).select("firstName lastName");
    if (!staff) {
      return NextResponse.json(
        { error: "Technician not found" },
        { status: 404 }
      );
    }

    // Update the maintenance ticket
    const maintenance = await Maintenance.findByIdAndUpdate(
      params.id,
      {
        $set: {
          staff: technicianId,
          scheduledDate,
          assignedAt: assignedAt || new Date(),
          currentStatus: "In Progress"
        },
        $push: {
          statusHistory: {
            status: "In Progress",
            comment: `Assigned to ${staff.firstName} ${staff.lastName}`,
            updatedAt: new Date(),
            updatedByModel: "User",
            updatedBy: session.user.id
          }
        }
      },
      { new: true }
    ).populate([
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
      },
      {
        path: "staff",
        select: "firstName lastName"
      }
    ]);

    // Send notification to tenant (but don't fail if it doesn't work)
    try {
      if (maintenance.room?.tenant?.lineUserId) {
        // Skip if lineUserId looks like a MongoDB ObjectId (24 hex chars)
        if (maintenance.room.tenant.lineUserId.match(/^[0-9a-fA-F]{24}$/)) {
          console.log("Skipping notification - lineUserId appears to be a MongoDB ObjectId, not a LINE ID");
        } else {
          const notificationMessage = `Your maintenance request has been assigned to ${staff.firstName} ${staff.lastName} and scheduled for ${format(new Date(scheduledDate), "MMMM d, yyyy")}`;
          
          await sendMaintenanceNotification({
            userId: maintenance.room.tenant.lineUserId,
            maintenance,
            status: "In Progress",
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
    console.error("Error assigning technician:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign technician" },
      { status: 500 }
    );
  }
}
