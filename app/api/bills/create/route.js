import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import Room from "@/app/models/Room";
import Bill from "@/app/models/Bill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { addMonths, format, isValid, parseISO, setDate } from "date-fns";

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { billingDate } = await request.json();
    console.log("Creating bills for date:", billingDate);
    
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
        // Get dueDate from building configuration (default to 5 if not set)
        const { dueDate = 5 } = building.billingConfig || {};
        
        // Calculate due date as the specified date of the next month
        const nextMonth = addMonths(parsedDate, 1);
        const dueDateObj = setDate(nextMonth, dueDate);
        
        // Validate dueDate
        if (!isValid(dueDateObj)) {
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

            console.log("Creating bill for room:", {
              roomNumber: room.roomNumber,
              price: room.price,
              rentAmount: room.price // Always use full rent amount for new bills
            });

            // Create new bill with proper fee structure
            // Note: Using price field for fee structure
            return Bill.create({
              roomId: room._id,
              buildingId: building._id,
              month: month,
              billingDate: parsedDate,
              dueDate: dueDateObj,
              rentAmount: room.price, // Always use full rent amount for new bills
              waterRate: building.waterRate,
              electricityRate: building.electricityRate,
              status: "pending",
              createdBy: session.user.id,
              additionalFees: [], // Initialize with empty array using price field
              notes: "",
              waterUsage: 0,
              electricityUsage: 0,
              waterAmount: 0,
              electricityAmount: 0,
              totalAmount: room.price, // Initial total is just the rent amount
              initialMeterReadings: {
                water: room.currentMeterReadings?.water || 0,
                electricity: room.currentMeterReadings?.electricity || 0,
                lastUpdated: room.currentMeterReadings?.lastUpdated || new Date()
              },
              currentMeterReadings: {
                water: room.currentMeterReadings?.water || 0,
                electricity: room.currentMeterReadings?.electricity || 0,
                lastUpdated: room.currentMeterReadings?.lastUpdated || new Date()
              }
            });
          })
        );

        console.log(`Created ${buildingBills.filter(Boolean).length} bills for building ${building.name}`);

        return buildingBills.filter(Boolean);
      })
    );

    console.log(`Created a total of ${bills.flat().length} bills`);

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