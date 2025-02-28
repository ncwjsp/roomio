import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import Expense from "@/app/models/Expense";
import User from "@/app/models/User";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "monthly";
    const year = searchParams.get("year") || new Date().getFullYear().toString();
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Find the user to ensure they exist
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Create landlord filter
    const landlordFilter = { landlordId: userId };
    
    // Get current date information
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    if (view === "monthly") {
      // Fetch monthly revenue and expense data for the selected year
      const monthlyData = [];
      
      // Array of month names
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      // Process each month
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(parseInt(year), month, 1);
        const endDate = new Date(parseInt(year), month + 1, 0);
        
        // Skip future months in current year
        if (parseInt(year) === currentYear && month > currentDate.getMonth()) {
          // Add placeholder data for future months
          monthlyData.push({
            month: monthNames[month],
            revenue: 0,
            expense: 0
          });
          continue;
        }
        
        // Query revenue (payments) for this month and landlord
        let revenue = 0;
        try {
          const bills = await Bill.find({
            ...landlordFilter,
            paidDate: { $gte: startDate, $lte: endDate },
            status: "Paid"
          });
          
          revenue = bills.reduce((total, bill) => total + bill.amount, 0);
        } catch (error) {
          console.error(`Error fetching payments for ${monthNames[month]}:`, error);
        }
        
        // Query expenses for this month and landlord
        let expense = 0;
        try {
          const expenses = await Expense.find({
            ...landlordFilter,
            date: { $gte: startDate, $lte: endDate }
          });
          
          expense = expenses.reduce((total, exp) => total + exp.amount, 0);
        } catch (error) {
          // If Expense model doesn't exist yet, just log and continue
          console.error(`Error fetching expenses for ${monthNames[month]}:`, error);
        }
        
        // Add data for this month
        monthlyData.push({
          month: monthNames[month],
          revenue,
          expense
        });
      }
      
      return NextResponse.json({ monthlyData });
    } else if (view === "yearly") {
      // Fetch yearly revenue and expense data
      const yearlyData = [];
      
      // Get the last 3 years
      const years = [
        (currentYear - 2).toString(),
        (currentYear - 1).toString(),
        currentYear.toString()
      ];
      
      // Process each year
      for (const yearValue of years) {
        const startDate = new Date(parseInt(yearValue), 0, 1);
        const endDate = new Date(parseInt(yearValue), 11, 31);
        
        // Query revenue (payments) for this year and landlord
        let revenue = 0;
        try {
          const payments = await Payment.find({
            ...landlordFilter,
            paidDate: { $gte: startDate, $lte: endDate },
            status: "Paid"
          });
          
          revenue = payments.reduce((total, payment) => total + payment.amount, 0);
        } catch (error) {
          console.error(`Error fetching payments for ${yearValue}:`, error);
        }
        
        // Query expenses for this year and landlord
        let expense = 0;
        try {
          const expenses = await Expense.find({
            ...landlordFilter,
            date: { $gte: startDate, $lte: endDate }
          });
          
          expense = expenses.reduce((total, exp) => total + exp.amount, 0);
        } catch (error) {
          console.error(`Error fetching expenses for ${yearValue}:`, error);
        }
        
        // Add data for this year
        yearlyData.push({
          year: yearValue,
          revenue,
          expense
        });
      }
      
      return NextResponse.json({ yearlyData });
    }
    
    return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching financial data:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial data" },
      { status: 500 }
    );
  }
}
