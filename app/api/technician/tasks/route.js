import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/app/models/Maintenance";
import Staff from "@/app/models/Staff";
import Room from "@/app/models/Room";
import Building from "@/app/models/Building";
import Floor from "@/app/models/Floor";
import User from "@/app/models/User";
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

    // Find the technician by lineUserId
    const technician = await Staff.findOne({ lineUserId });
    if (!technician) {
      return NextResponse.json(
        { error: "Technician not found" },
        { status: 404 }
      );
    }

    // Get all maintenance tasks assigned to this technician
    const tasks = await Maintenance.find({
      staff: technician._id,
      currentStatus: { $in: ["In Progress", "Pending"] }
    })
    .populate({
      path: "room",
      model: Room,
      select: "building floor roomNumber tenant",
      populate: [
        {
          path: "building",
          select: "name"
        },
        {
          path: "floor",
          select: "floorNumber"
        },
        {
          path: "tenant",
          select: "name phone lineUserId"
        }
      ]
    });

    const completedTasks = await Maintenance.find({
      staff: technician._id,
      currentStatus: "Completed"
    })
    .populate({
      path: "room",
      model: Room,
      select: "building floor roomNumber tenant",
      populate: [
        {
          path: "building",
          select: "name"
        },
        {
          path: "floor",
          select: "floorNumber"
        },
        {
          path: "tenant",
          select: "name phone lineUserId"
        }
      ]
    });

    return NextResponse.json({
      technicianId: technician._id,
      activeTasks: tasks,
      completedTasks
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
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

    const maintenance = await Maintenance.findById(taskId);
    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance task not found" },
        { status: 404 }
      );
    }

    // Add status history
    maintenance.statusHistory.push({
      status,
      comment: comment || "",
      updatedAt: new Date(),
      updatedBy: technicianId,
      updatedByModel: "Staff"
    });

    maintenance.currentStatus = status;
    await maintenance.save();

    // Populate the same fields as in GET for consistency
    await maintenance.populate([
      {
        path: "room",
        populate: [
          {
            path: "floor",
            populate: {
              path: "building",
            },
          },
          {
            path: "tenant",
            select: "name phone lineUserId",
          },
        ],
      },
      {
        path: "staff",
        select: "firstName lastName specialization",
      },
    ]);

    // Get the landlord's ID for Line notifications
    const landlord = await User.findOne({
      "lineConfig.channelAccessToken": { $exists: true },
      "lineConfig.channelSecret": { $exists: true },
    });

    if (landlord) {
      // Send Line notification
      await sendMaintenanceNotification({
        userId: landlord._id,
        maintenance,
        status,
        comment: comment || `Status updated to ${status} by ${maintenance.staff.firstName} ${maintenance.staff.lastName}`,
      });
    }

    return NextResponse.json({ task: maintenance });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
