import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";
import User from "@/app/models/User";
import Parcel from "@/app/models/Parcel";
import Maintenance from "@/app/models/Maintenance";
import Payment from "@/app/models/Payment";
import Staff from "@/app/models/Staff";

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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
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
      totalRooms = await Room.countDocuments({createdBy: userId});
      occupiedRooms = await Room.countDocuments({createdBy: userId, status: "Occupied" });
      availableRooms = await Room.countDocuments({ createdBy: userId, status: "Available" });
      unavailableRooms = await Room.countDocuments({ createdBy: userId, status: "Unavailable" });
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

    // Get maintenance statistics for this landlord
    let pendingMaintenance = 0;
    let inProgressMaintenance = 0;
    let completedMaintenance = 0;
    
    try {
      pendingMaintenance = await Maintenance.countDocuments({ 
        ...landlordFilter, 
        status: "Pending" 
      });
      inProgressMaintenance = await Maintenance.countDocuments({ 
        ...landlordFilter, 
        status: "In Progress" 
      });
      completedMaintenance = await Maintenance.countDocuments({ 
        ...landlordFilter, 
        status: "Completed" 
      });
    } catch (error) {
      console.error("Error counting maintenance:", error);
    }

    // Get payment statistics for this landlord
    let paidPayments = 0;
    let overduePayments = 0;
    let waitingPayments = 0;
    
    try {
      paidPayments = await Payment.countDocuments({ 
        ...landlordFilter, 
        status: "Paid" 
      });
      overduePayments = await Payment.countDocuments({ 
        ...landlordFilter, 
        status: "Overdue" 
      });
      waitingPayments = await Payment.countDocuments({ 
        ...landlordFilter, 
        status: "Waiting" 
      });
    } catch (error) {
      console.error("Error counting payments:", error);
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
      { name: "Paid", value: paidPayments, color: "#4CAF50" },
      { name: "Overdue", value: overduePayments, color: "#F44336" },
      { name: "Waiting", value: waitingPayments, color: "#FFC107" },
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
    ];

    // Return all dashboard data
    return NextResponse.json({
      overviewStats,
      overduePaymentPieData,
      roomVacancyPieData,
      maintenancePieData,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
