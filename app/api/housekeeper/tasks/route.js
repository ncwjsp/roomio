import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";
import Room from "@/app/models/Room";
import Building from "@/app/models/Building";
import Floor from "@/app/models/Floor";
import Cleaning from "@/app/models/Cleaning";

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

    // Find the housekeeper by lineUserId
    const housekeeper = await Staff.findOne({ 
      lineUserId,
      role: "housekeeper" // Ensure we only get housekeepers
    });
    
    if (!housekeeper) {
      console.log("No housekeeper found for lineUserId:", lineUserId);
      return NextResponse.json(
        { error: "Housekeeper not found" },
        { status: 404 }
      );
    }

    // Get the buildings this housekeeper is assigned to
    const assignedBuildings = await Building.find({
      housekeepers: housekeeper._id
    });

    console.log("Found housekeeper:", {
      id: housekeeper._id,
      name: `${housekeeper.firstName} ${housekeeper.lastName}`,
      buildingCount: assignedBuildings.length
    });

    const buildingIds = assignedBuildings.map(b => b._id);

    // Get all cleaning tasks for the assigned buildings
    const activeTasks = await Cleaning.find({
      building: { $in: buildingIds },
      status: { $in: ["Pending", "In Progress"] },
      date: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today and future tasks
      }
    }).populate([
      {
        path: "building",
        select: "name"
      },
      {
        path: "room",
        select: "roomNumber floor",
        populate: {
          path: "floor",
          select: "floorNumber"
        }
      }
    ]).sort({ date: 1 });

    console.log("Found active tasks:", activeTasks.length);

    const completedTasks = await Cleaning.find({
      building: { $in: buildingIds },
      status: "Completed",
      date: { 
        $gte: new Date(new Date().setDate(new Date().getDate() - 7)) // Last 7 days
      }
    }).populate([
      {
        path: "building",
        select: "name"
      },
      {
        path: "room",
        select: "roomNumber floor",
        populate: {
          path: "floor",
          select: "floorNumber"
        }
      }
    ]).sort({ date: -1 });

    console.log("Found completed tasks:", completedTasks.length);

    return NextResponse.json({
      housekeeperId: housekeeper._id,
      activeTasks,
      completedTasks,
      assignedBuildings
    });
  } catch (error) {
    console.error("Error fetching cleaning tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch cleaning tasks" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();

    const data = await request.json();
    const { taskId, status, comment, housekeeperId } = data;

    if (!taskId || !status || !housekeeperId) {
      return NextResponse.json(
        { error: "Task ID, status, and housekeeper ID are required" },
        { status: 400 }
      );
    }

    const task = await Cleaning.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Update the task status
    task.status = status;
    if (comment) {
      task.comments.push({
        text: comment,
        staff: housekeeperId,
        timestamp: new Date()
      });
    }

    if (status === "Completed") {
      task.completedAt = new Date();
      task.completedBy = housekeeperId;
    }

    await task.save();

    // Populate the updated task
    await task.populate([
      {
        path: "building",
        select: "name"
      },
      {
        path: "room",
        select: "roomNumber floor",
        populate: {
          path: "floor",
          select: "floorNumber"
        }
      }
    ]);

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error updating cleaning task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
