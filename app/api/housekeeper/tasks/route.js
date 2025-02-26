import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";
import Building from "@/app/models/Building";
import CleaningSchedule from "@/app/models/CleaningSchedule";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";
import { sendLineMessage } from "@/lib/line";

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
        select: 'name'
      },
      {
        path: 'slots.bookedBy',
        model: 'Tenant',
        select: 'name phone lineUserId room',
        populate: {
          path: 'room',
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
          console.log('Processing slot:', {
            id: slotObj._id,
            date: slotObj.date,
            status: slotObj.status,
            bookedBy: slotObj.bookedBy?._id
          });
          
          slots.push({
            ...slotObj,
            building: schedule.buildingId?.name || 'Unknown Building',
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
    const { slotId, status, lineUserId } = body;

    if (!slotId || !status) {
      return NextResponse.json(
        { error: "Slot ID and status are required" },
        { status: 400 }
      );
    }

    // Find the schedule containing this slot
    const schedule = await CleaningSchedule.findOne({
      'slots._id': slotId
    }).populate([
      {
        path: 'buildingId',
        select: 'name'
      },
      {
        path: 'slots.bookedBy',
        model: 'Tenant',
        select: 'name phone lineUserId room',
        populate: {
          path: 'room',
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
    const slot = schedule.slots.id(slotId);
    if (!slot) {
      return NextResponse.json(
        { error: "Slot not found" },
        { status: 404 }
      );
    }

    // Update slot status
    slot.status = status;
    if (status === 'completed') {
      slot.completedAt = new Date();
      slot.completedBy = lineUserId;
    }

    await schedule.save();

    // If status is completed, send notification to tenant
    if (status === 'completed' && slot.bookedBy?.lineUserId) {
      const message = `Your room cleaning for ${schedule.buildingId.name} Room ${slot.bookedBy.room.roomNumber} has been completed.`;
      await sendLineMessage(slot.bookedBy.lineUserId, message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/housekeeper/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
