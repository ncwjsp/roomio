import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Room from "@/app/models/Room";
import Bill from "@/app/models/Bill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { addDays, format } from "date-fns";

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { billingDate } = await request.json();
    // Format month as string in YYYY-MM format
    const month = format(new Date(billingDate), "yyyy-MM");

    // Get all buildings for the user
    const userBuildings = await Building.find({ createdBy: session.user.id });

    // Create bills for each building
    const bills = await Promise.all(
      userBuildings.map(async (building) => {
        // Get billing configuration from building
        const { dueDays } = building.billingConfig;

        // Calculate due date based on billing date and dueDays
        const dueDate = addDays(new Date(billingDate), dueDays);

        // Get all rooms in the building with tenants
        const rooms = await Room.find({
          floor: { $in: building.floors },
          tenant: { $exists: true, $ne: null },
        }).populate("tenant");

        // Create bills for each room
        const buildingBills = await Promise.all(
          rooms.map(async (room) => {
            // Check if bill already exists for this room and month
            const existingBill = await Bill.findOne({
              roomId: room._id,
              month: month, // Use the string format
            });

            if (existingBill) {
              return null;
            }

            return Bill.create({
              roomId: room._id,
              month: month, // Use the string format
              billingDate: new Date(billingDate),
              dueDate,
              rentAmount: room.price,
              waterRate: building.waterRate,
              electricityRate: building.electricityRate,
              status: "pending",
              createdBy: session.user.id,
              additionalFees: [],
              notes: "",
              waterUsage: 0,
              electricityUsage: 0,
              waterAmount: 0,
              electricityAmount: 0,
              totalAmount: room.price, // Initial total is just the rent amount
            });
          })
        );

        return buildingBills.filter(Boolean);
      })
    );

    return NextResponse.json({
      message: "Bills created successfully",
      bills: bills.flat(),
    });
  } catch (error) {
    console.error("Error creating bills:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create bills" },
      { status: 500 }
    );
  }
}
