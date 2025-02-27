import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Room from "@/app/models/Room";
import Bill from "@/app/models/Bill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { addDays, format, isValid, parseISO, getDaysInMonth } from "date-fns";

// Calculate prorated rent for mid-month move-ins
const calculateRentAmount = (moveInDate, roomPrice, billingDate) => {
  // If move-in date is after billing date
  if (moveInDate > billingDate) {
    // Calculate days until next billing date
    const nextBillingDate = new Date(billingDate);
    nextBillingDate.setMonth(billingDate.getMonth() + 1);

    const daysInMonth = getDaysInMonth(billingDate);
    const daysStayed = Math.ceil(
      (nextBillingDate - moveInDate) / (1000 * 60 * 60 * 24)
    );

    return Math.round((roomPrice / daysInMonth) * daysStayed);
  }

  return roomPrice; // Full month for regular billing
};

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { billingDate } = await request.json();
    
    // Validate billingDate
    const parsedDate = parseISO(billingDate);
    if (!isValid(parsedDate)) {
      return NextResponse.json(
        { error: "Invalid billing date format. Please use YYYY-MM-DD format." },
        { status: 400 }
      );
    }

    // Format month as string in YYYY-MM format
    const month = format(parsedDate, "yyyy-MM");

    // Get all buildings for the user
    const userBuildings = await Building.find({ createdBy: session.user.id });

    // Create bills for each building
    const bills = await Promise.all(
      userBuildings.map(async (building) => {
        // Get billing configuration from building
        const { dueDays = 7 } = building.billingConfig || {}; // Default to 7 days if not set

        // Calculate due date based on billing date and dueDays
        const dueDate = addDays(parsedDate, dueDays);
        
        // Validate dueDate
        if (!isValid(dueDate)) {
          throw new Error("Invalid due date calculated");
        }

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
              month: month,
            });

            if (existingBill) {
              return null;
            }

            // Calculate prorated rent if tenant moved in after billing date
            const moveInDate = room.tenant?.moveInDate ? new Date(room.tenant.moveInDate) : null;
            const rentAmount = moveInDate ? calculateRentAmount(moveInDate, room.price, parsedDate) : room.price;

            return Bill.create({
              roomId: room._id,
              buildingId: building._id,
              month: month,
              billingDate: parsedDate,
              dueDate,
              rentAmount,
              waterRate: building.waterRate,
              electricityRate: building.electricityRate,
              status: "pending",
              createdBy: session.user.id,
              additionalFees: [],
              notes: moveInDate > parsedDate ? "Prorated rent for mid-month move-in" : "",
              waterUsage: 0,
              electricityUsage: 0,
              waterAmount: 0,
              electricityAmount: 0,
              totalAmount: rentAmount, // Initial total is just the rent amount
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
