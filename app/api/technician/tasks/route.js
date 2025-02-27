import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/app/models/Maintenance";
import Staff from "@/app/models/Staff";
import Room from "@/app/models/Room";
import Building from "@/app/models/Building";
import Floor from "@/app/models/Floor";
import User from "@/app/models/User";
import LineContact from "@/app/models/LineContact"; // Added import statement
import { sendMaintenanceNotification } from "@/lib/notifications";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");

    if (!lineUserId) {
      return NextResponse.json(
        { error: "Line User ID is required" },
        { status: 400 }
      );
    }

    // Find staff member by Line User ID
    const staff = await Staff.findOne({ lineUserId });
    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Get all active maintenance tasks assigned to this staff member
    const activeTasks = await Maintenance.find({
      staff: staff._id,
      currentStatus: { $nin: ["Completed", "Cancelled"] },
      scheduledDate: { $exists: true }
    }).populate([
      {
        path: "room",
        select: "roomNumber images",
        populate: {
          path: "floor",
          select: "floorNumber images",
          populate: {
            path: "building",
            select: "name images"
          }
        }
      }
    ]).sort({ scheduledDate: 1 });

    // Get completed and cancelled maintenance tasks assigned to this staff member
    const completedTasks = await Maintenance.find({
      staff: staff._id,
      currentStatus: { $in: ["Completed", "Cancelled"] },
      scheduledDate: { $exists: true }
    }).populate([
      {
        path: "room",
        select: "roomNumber images",
        populate: {
          path: "floor",
          select: "floorNumber images",
          populate: {
            path: "building",
            select: "name images"
          }
        }
      }
    ]).sort({ updatedAt: -1 });

    return NextResponse.json({
      activeTasks,
      completedTasks
    });
  } catch (error) {
    console.error("Error fetching technician tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch technician tasks" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();

    const data = await request.json();
    const { taskId, status, comment, technicianId } = data;

    if (!taskId || !status || !technicianId) {
      return NextResponse.json(
        { error: "Task ID, status, and technician ID are required" },
        { status: 400 }
      );
    }

    // Validate status against allowed values
    const allowedStatuses = ["Pending", "In Progress", "Completed", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // First find the staff member by their Line User ID
    const staff = await Staff.findOne({ lineUserId: technicianId });
    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    const maintenance = await Maintenance.findById(taskId).populate([
      {
        path: "room",
        select: "roomNumber tenant createdBy floor images",
        populate: [
          {
            path: "floor",
            select: "name building images",
            populate: {
              path: "building",
              select: "name images"
            }
          },
          {
            path: "tenant",
            select: "name lineUserId email phone"
          },
          {
            path: "createdBy",
            select: "name lineConfig"
          }
        ]
      },
      {
        path: "staff",
        select: "firstName lastName"
      }
    ]);

    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance task not found" },
        { status: 404 }
      );
    }

    console.log("Maintenance data:", {
      id: maintenance._id,
      problem: maintenance.problem,
      roomNumber: maintenance.room?.roomNumber,
      tenantName: maintenance.room?.tenant?.name,
      tenantLineUserId: maintenance.room?.tenant?.lineUserId,
      landlordLineConfig: !!maintenance.room?.createdBy?.lineConfig
    });

    // Add status history using the staff's ObjectId
    maintenance.statusHistory.push({
      status,
      comment: comment || "",
      updatedAt: new Date(),
      updatedBy: staff._id,
      updatedByModel: "Staff"
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
          const notificationMessage = comment || `Your maintenance request has been ${status.toLowerCase()} by ${staff.firstName} ${staff.lastName}`;
          
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
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
