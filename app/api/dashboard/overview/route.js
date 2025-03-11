import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";
import User from "@/app/models/User";
import Parcel from "@/app/models/Parcel";
import Maintenance from "@/app/models/Maintenance";
import CleaningSchedule from "@/app/models/CleaningSchedule";
import Staff from "@/app/models/Staff";
import Building from "@/app/models/Building";
import Bill from "@/app/models/Bill";

export async function GET(request) {
  try {
    await dbConnect();

    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the user to ensure they exist and get their role
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create landlord filter - used to filter data by landlord
    const landlordFilter = { landlordId: userId };

    // Get total tenants for this landlord
    let totalTenants = 0;
    try {
      totalTenants = await Tenant.countDocuments(landlordFilter);
    } catch (error) {
      console.error("Error counting tenants:", error);
    }

    // Get room statistics for this landlord
    let totalRooms = 0;
    let occupiedRooms = 0;
    let availableRooms = 0;
    let unavailableRooms = 0;

    try {
      totalRooms = await Room.countDocuments({ createdBy: userId });
      occupiedRooms = await Room.countDocuments({
        createdBy: userId,
        status: "Occupied",
      });
      availableRooms = await Room.countDocuments({
        createdBy: userId,
        status: "Available",
      });
      unavailableRooms = await Room.countDocuments({
        createdBy: userId,
        status: "Unavailable",
      });
    } catch (error) {
      console.error("Error counting rooms:", error);
    }

    // Get total staff for this landlord
    let totalStaff = 0;
    try {
      totalStaff = await Staff.countDocuments({ landlordId: userId });
    } catch (error) {
      console.error("Error counting staff:", error);
    }

    // Get total parcels for this landlord
    let totalParcels = 0;
    try {
      totalParcels = await Parcel.countDocuments(landlordFilter);
    } catch (error) {
      console.error("Error counting parcels:", error);
    }

    // Get maintenance statistics
    let pendingMaintenance = 0;
    let inProgressMaintenance = 0;
    let completedMaintenance = 0;
    let cancelledMaintenance = 0;

    try {
      pendingMaintenance = await Maintenance.countDocuments({
        landlordId: userId,
        currentStatus: "Pending",
      });
      inProgressMaintenance = await Maintenance.countDocuments({
        landlordId: userId,
        currentStatus: "In Progress",
      });
      completedMaintenance = await Maintenance.countDocuments({
        landlordId: userId,
        currentStatus: "Completed",
      });
      cancelledMaintenance = await Maintenance.countDocuments({
        landlordId: userId,
        currentStatus: "Cancelled",
      });
    } catch (error) {
      console.error("Error counting maintenance:", error);
    }

    // Get cleaning statistics
    let availableCleaning = 0;
    let pendingCleaning = 0;
    let completedCleaning = 0;
    let cancelledCleaning = 0;

    try {
      // Get all cleaning schedules for this landlord
      const cleaningSchedules = await CleaningSchedule.find({
        landlordId: userId,
      });

      // Count slots by status
      cleaningSchedules.forEach((schedule) => {
        schedule.slots.forEach((slot) => {
          switch (slot.status) {
            case "available":
              availableCleaning++;
              break;
            case "pending":
              pendingCleaning++;
              break;
            case "completed":
              completedCleaning++;
              break;
            case "cancelled":
              cancelledCleaning++;
              break;
          }
        });
      });
    } catch (error) {
      console.error("Error counting cleaning slots:", error);
    }

    // Get payment statistics for this landlord
    let paidBills = 0;
    let pendingBills = 0;
    let nullBills = 0;

    try {
      // Add logging to debug
      console.log("Fetching bill statistics for user:", userId);

      paidBills = await Bill.countDocuments({
        createdBy: userId,
        paymentStatus: "paid",
        isSent: true,
      });
      pendingBills = await Bill.countDocuments({
        createdBy: userId,
        paymentStatus: "pending",
        isSent: true,
      });
      nullBills = await Bill.countDocuments({
        createdBy: userId,
        paymentStatus: "null",
        isSent: true,
      });

      // Log the results
      console.log("Bill statistics:", {
        paid: paidBills,
        pending: pendingBills,
        null: nullBills,
      });
    } catch (error) {
      console.error("Error counting bills:", error);
    }

    // Prepare overview statistics
    const overviewStats = [
      { title: "Total Tenants", value: totalTenants, icon: "tenant" },
      { title: "Total Rooms", value: totalRooms, icon: "room" },
      { title: "Total Staff", value: totalStaff, icon: "staff" },
      { title: "Total Parcels", value: totalParcels, icon: "parcel" },
    ];

    // Prepare pie chart data for payments
    const overduePaymentPieData = [
      { name: "Paid", value: paidBills, color: "#4CAF50" },
      { name: "Pending", value: pendingBills, color: "#FFC107" },
      { name: "Not Sent", value: nullBills, color: "#9E9E9E" },
    ];

    // Prepare pie chart data for room vacancy
    const roomVacancyPieData = [
      { name: "Available Rooms", value: availableRooms, color: "#4CAF50" },
      { name: "Occupied Rooms", value: occupiedRooms, color: "#FFC107" },
      { name: "Unavailable Rooms", value: unavailableRooms, color: "#F44336" },
    ];

    // Prepare pie chart data for maintenance
    const maintenancePieData = [
      { name: "Pending", value: pendingMaintenance, color: "#FFC107" },
      { name: "In Progress", value: inProgressMaintenance, color: "#2196F3" },
      { name: "Completed", value: completedMaintenance, color: "#4CAF50" },
      { name: "Cancelled", value: cancelledMaintenance, color: "#F44336" },
    ];

    // Prepare pie chart data for cleaning
    const cleaningPieData = [
      { name: "Available", value: availableCleaning, color: "#4CAF50" },
      { name: "Pending", value: pendingCleaning, color: "#FFC107" },
      { name: "Completed", value: completedCleaning, color: "#2196F3" },
      { name: "Cancelled", value: cancelledCleaning, color: "#F44336" },
    ];

    // Return all dashboard data
    return NextResponse.json({
      overviewStats,
      overduePaymentPieData,
      roomVacancyPieData,
      maintenancePieData,
      cleaningPieData,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
