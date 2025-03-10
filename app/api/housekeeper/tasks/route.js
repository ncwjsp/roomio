import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";
import Building from "@/app/models/Building";
import CleaningSchedule from "@/app/models/CleaningSchedule";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";
import User from "@/app/models/User";
import { sendLineMessage } from "@/lib/line";
import { format, parseISO } from "date-fns";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");

    if (!lineUserId) {
      return NextResponse.json(
        { error: "Line user ID is required" },
        { status: 400 }
      );
    }

    // Find the housekeeper by lineUserId
    const housekeeper = await Staff.findOne({ lineUserId, role: "Housekeeper" });
    console.log('Found housekeeper:', housekeeper?._id);

    if (!housekeeper) {
      return NextResponse.json(
        { error: "Housekeeper not found" },
        { status: 404 }
      );
    }

    // Find buildings where this housekeeper is assigned
    const buildings = await Building.find({
      housekeepers: housekeeper._id
    });
    console.log('Found buildings:', buildings.length);

    if (!buildings?.length) {
      console.log('No buildings assigned to housekeeper');
      return NextResponse.json({
        activeTasks: [],
        completedTasks: [],
        assignedBuildings: []
      });
    }

    const buildingIds = buildings.map(b => b._id);
    console.log('Building IDs:', buildingIds);

    // Get all cleaning schedules for buildings assigned to this housekeeper
    const schedules = await CleaningSchedule.find({
      buildingId: { $in: buildingIds }
    }).populate([
      {
        path: 'buildingId',
        select: '_id name'
      },
      {
        path: 'slots.bookedBy',
        model: 'Tenant',
        select: 'name phone lineUserId',
        populate: {
          path: 'room',
          model: 'Room',
          select: 'roomNumber floor'
        }
      }
    ]);
    
    console.log('Schedule query:', {
      buildingId: { $in: buildingIds }
    });
    console.log('Found schedules:', schedules.length);
    
    if (schedules.length > 0) {
      const firstSchedule = schedules[0];
    }

    // Extract all slots from schedules
    const slots = [];
    for (const schedule of schedules) {
      if (!schedule.slots?.length) continue;
      
      for (const slot of schedule.slots) {
        if (!slot.bookedBy || !slot.status) continue;
        
        try {
          const slotObj = slot.toObject();

          slots.push({
            ...slotObj,
            building: schedule.buildingId,
            buildingId: schedule.buildingId?._id
          });
        } catch (error) {
          console.error('Error processing slot:', error);
        }
      }
    }
    
    console.log('Total slots found:', slots.length);
    if (slots.length > 0) {
      console.log('Sample slot:', slots[0]);
    }

    // Convert slots to tasks format
    const activeTasks = [];
    const completedTasks = [];

    for (const slot of slots) {
      if (!slot.bookedBy) continue;

      try {
        const task = {
          _id: slot._id,
          building: slot.building,
          buildingId: slot.buildingId,
          date: slot.date,
          timeSlot: `${slot.fromTime} - ${slot.toTime}`,
          fromTime: slot.fromTime,
          toTime: slot.toTime,
          status: slot.status || 'waiting',
          bookedAt: slot.bookedAt,
          completedAt: slot.completedAt,
          completedBy: slot.completedBy,
          tenant: slot.bookedBy ? {
            name: slot.bookedBy.name,
            phone: slot.bookedBy.phone,
            lineId: slot.bookedBy.lineId,
            roomNumber: slot.bookedBy.room?.roomNumber
          } : null
        };

        // Add to appropriate list based on status
        if (slot.status === 'completed' || slot.status === 'cancelled') {
          completedTasks.push(task);
        } else {
          activeTasks.push(task);
        }
      } catch (error) {
        console.error('Error creating task:', error);
      }
    }

    console.log('Active tasks:', activeTasks.length);
    console.log('Completed tasks:', completedTasks.length);
    if (completedTasks.length > 0) {
      console.log('Sample completed task:', completedTasks[0]);
    }

    // Sort active tasks by date and time
    activeTasks.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    // Sort completed tasks by completedAt in descending order
    completedTasks.sort((a, b) => {
      if (!a.completedAt) return 1;
      if (!b.completedAt) return -1;
      return new Date(b.completedAt) - new Date(a.completedAt);
    });

    return NextResponse.json({
      activeTasks,
      completedTasks,
      assignedBuildings: buildings
    });
  } catch (error) {
    console.error("Error in GET /api/housekeeper/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();

    const body = await request.json();
    console.log('Request body:', body);
    const { taskId, slotId, status, lineUserId } = body;
    
    // Accept either taskId or slotId
    const targetId = taskId || slotId;

    if (!targetId || !status) {
      return NextResponse.json(
        { error: "Task ID and status are required" },
        { status: 400 }
      );
    }

    // Find the schedule containing this slot
    const schedule = await CleaningSchedule.findOne({
      'slots._id': targetId
    }).populate([
      {
        path: 'buildingId',
        select: '_id name'
      },
      {
        path: 'slots.bookedBy',
        model: 'Tenant',
        select: 'name phone lineUserId room',
        populate: {
          path: 'room',
          model: 'Room',
          select: 'roomNumber floor'
        }
      }
    ]);

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Find and update the specific slot
    const slot = schedule.slots.id(targetId);
    if (!slot) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Update slot status
    slot.status = status;
    if (status === 'completed') {
      slot.completedAt = new Date();
      slot.completedBy = lineUserId;
    } else if (status === 'cancelled') {
      slot.completedAt = new Date();  // Use completedAt for cancelled tasks too
      slot.completedBy = lineUserId;  // Track who cancelled it
    }

    await schedule.save();

    // Reload the schedule to get the populated data
    const updatedSchedule = await CleaningSchedule.findOne({
      'slots._id': targetId
    }).populate([
      {
        path: 'buildingId',
        select: '_id name'
      },
      {
        path: 'slots.bookedBy',
        model: 'Tenant',
        select: 'name phone lineUserId room',
        populate: {
          path: 'room',
          model: 'Room',
          select: 'roomNumber floor'
        }
      }
    ]);
    
    const updatedSlot = updatedSchedule.slots.id(targetId);

    // If status is completed or cancelled, send notification to tenant
    if ((status === 'completed' || status === 'cancelled') && updatedSlot.bookedBy?.lineUserId) {
      const user = await User.findById(schedule.landlordId);
      const message = {
        to: updatedSlot.bookedBy.lineUserId,
        messages: [{
          type: "flex",
          altText: `Room Cleaning ${status === 'completed' ? 'Completed' : 'Cancelled'}`,
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: `Room Cleaning ${status === 'completed' ? 'Completed' : 'Cancelled'}`,
                  weight: "bold",
                  size: "lg",
                  color: "#FFFFFF",
                },
              ],
              backgroundColor: status === 'completed' ? "#898F63" : "#DC3545",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  margin: "lg",
                  contents: [
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "Date",
                          color: "#aaaaaa",
                          size: "sm",
                          flex: 1,
                        },
                        {
                          type: "text",
                          text: format(parseISO(updatedSlot.date), "EEEE, MMMM d, yyyy"),
                          wrap: true,
                          size: "sm",
                          color: "#666666",
                          flex: 4,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "Time",
                          color: "#aaaaaa",
                          size: "sm",
                          flex: 1,
                        },
                        {
                          type: "text",
                          text: `${updatedSlot.fromTime} - ${updatedSlot.toTime}`,
                          wrap: true,
                          color: "#666666",
                          size: "sm",
                          flex: 4,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "Room",
                          color: "#aaaaaa",
                          size: "sm",
                          flex: 1,
                        },
                        {
                          type: "text",
                          text: updatedSlot.bookedBy.room.roomNumber,
                          wrap: true,
                          color: "#666666",
                          size: "sm",
                          flex: 4,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: status === 'completed' 
                    ? "Your room has been cleaned. Thank you for using our service."
                    : "Your cleaning appointment has been cancelled.",
                  wrap: true,
                  color: "#aaaaaa",
                  size: "xs",
                  align: "center",
                },
              ],
            },
          },
        }]
      };
      await sendLineMessage(user.lineConfig.channelAccessToken, message);
    }

    return NextResponse.json({ 
      success: true,
      task: {
        _id: updatedSlot._id,
        status: updatedSlot.status,
        completedAt: updatedSlot.completedAt,
        completedBy: updatedSlot.completedBy,
        date: updatedSlot.date,
        timeSlot: `${updatedSlot.fromTime} - ${updatedSlot.toTime}`,
        fromTime: updatedSlot.fromTime,
        toTime: updatedSlot.toTime,
        building: updatedSchedule.buildingId,
        buildingId: updatedSchedule.buildingId._id,
        bookedAt: updatedSlot.bookedAt,
        tenant: updatedSlot.bookedBy ? {
          name: updatedSlot.bookedBy.name,
          phone: updatedSlot.bookedBy.phone,
          lineId: updatedSlot.bookedBy.lineId,
          roomNumber: updatedSlot.bookedBy.room?.roomNumber
        } : null
      }
    });
  } catch (error) {
    console.error("Error in PUT /api/housekeeper/tasks:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
