import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import Room from "@/app/models/Room";
import { startOfMonth, addMonths } from "date-fns";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import Building from "@/app/models/Building";
import Floor from "@/app/models/Floor";

export async function POST(request) {
  try {
    await dbConnect();

    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { month } = await request.json();
    console.log("Received month:", month);

    if (!month) {
      return NextResponse.json(
        { error: "Month parameter is required" },
        { status: 400 }
      );
    }

    const billMonth = startOfMonth(new Date(month));
    console.log("Billing month:", billMonth);

    // First get all buildings owned by the user
    const userBuildings = await Building.find({ createdBy: session.user.id });
    const buildingIds = userBuildings.map((b) => b._id);

    // Then get all floors in these buildings
    const floors = await Floor.find({ building: { $in: buildingIds } });
    const floorIds = floors.map((f) => f._id);

    // Now get all occupied rooms in these floors
    const roomQuery = {
      status: "Occupied",
      tenant: { $exists: true },
      floor: { $in: floorIds },
    };
    console.log("Room query:", roomQuery);

    const occupiedRooms = await Room.find(roomQuery)
      .populate({
        path: "floor",
        populate: {
          path: "building",
          select: "waterRate electricityRate",
        },
      })
      .populate({
        path: "tenant",
        select: "firstName lastName",
      });

    console.log("Query result:", JSON.stringify(occupiedRooms, null, 2));

    if (!occupiedRooms || occupiedRooms.length === 0) {
      // Check if there are any rooms at all in these floors
      const allRooms = await Room.find({ floor: { $in: floorIds } });
      console.log("Total rooms found:", allRooms.length);
      console.log(
        "Room statuses:",
        allRooms.map((r) => ({
          number: r.roomNumber,
          status: r.status,
          hasTenant: !!r.tenant,
        }))
      );

      return NextResponse.json(
        {
          error: "No occupied rooms found",
          details: {
            totalRooms: allRooms.length,
            query: roomQuery,
          },
        },
        { status: 400 }
      );
    }

    // Create bills for each occupied room
    const bills = await Promise.all(
      occupiedRooms.map(async (room) => {
        const existingBill = await Bill.findOne({
          roomId: room._id,
          month: billMonth,
        });

        if (existingBill) {
          return existingBill;
        }

        return Bill.create({
          roomId: room._id,
          tenantId: room.tenant._id,
          buildingId: room.floor.building._id,
          month: billMonth,
          rentAmount: room.price,
          waterRate: room.floor.building.waterRate,
          electricityRate: room.floor.building.electricityRate,
          dueDate: addMonths(billMonth, 1),
          status: "pending",
          createdBy: session.user.id, // Add user reference to bill
        });
      })
    );

    console.log("Created bills:", bills);

    return NextResponse.json({ bills }, { status: 201 });
  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: "Failed to create bills",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
