import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import Staff from "@/app/models/Staff";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { format, parse, getYear } from "date-fns";

export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "Monthly"; // Monthly or Yearly
    const year =
      searchParams.get("year") || new Date().getFullYear().toString();
    const month = searchParams.get("month") || format(new Date(), "MMM");

    // For monthly view, get data for the specific month
    if (view === "Monthly") {
      // Get all bills for the specified month and year
      const monthIndex = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ].indexOf(month);
      const monthFormatted = `${year}-${String(monthIndex + 1).padStart(
        2,
        "0"
      )}`;

      // Get all paid bills for the month
      const paidBills = await Bill.find({
        createdBy: userId,
        month: monthFormatted,
        paymentStatus: "paid",
      });

      // Get all bills for the month (paid or not) for utility calculations
      const allBills = await Bill.find({
        createdBy: userId,
        month: monthFormatted,
      });

      // Calculate total rent revenue (only from paid bills)
      const totalRentRevenue = paidBills.reduce(
        (sum, bill) => sum + (bill.rentAmount || 0),
        0
      );

      // Calculate total electricity and water usage from all bills
      const totalElectricityUsage = allBills.reduce((sum, bill) => {
        return sum + (bill.electricityAmount || 0);
      }, 0);

      const totalWaterUsage = allBills.reduce((sum, bill) => {
        return sum + (bill.waterAmount || 0);
      }, 0);

      // Get staff salary for the month
      const staffMembers = await Staff.find({ createdBy: userId });
      const totalStaffSalary = staffMembers.reduce(
        (sum, staff) => sum + (staff.salary || 0),
        0
      );

      return NextResponse.json({
        summary: {
          rentRevenue: totalRentRevenue,
          electricityUsage: totalElectricityUsage,
          waterUsage: totalWaterUsage,
          staffSalary: totalStaffSalary,
        },
      });
    }
    // For yearly view, get data for all months in the specified year
    else {
      const yearlyData = [];
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Get all bills for the year
      const yearBills = await Bill.find({
        createdBy: userId,
        month: { $regex: `^${year}-` },
      });

      // Get staff members
      const staffMembers = await Staff.find({ createdBy: userId });
      const monthlyStaffSalary = staffMembers.reduce(
        (sum, staff) => sum + (staff.salary || 0),
        0
      );

      // Process data for each month
      for (let i = 0; i < 12; i++) {
        const monthStr = String(i + 1).padStart(2, "0");
        const monthFormatted = `${year}-${monthStr}`;

        // Filter bills for this month
        const monthBills = yearBills.filter(
          (bill) => bill.month === monthFormatted
        );
        const paidMonthBills = monthBills.filter(
          (bill) => bill.paymentStatus === "paid"
        );

        // Calculate metrics
        const rentRevenue = paidMonthBills.reduce(
          (sum, bill) => sum + (bill.rentAmount || 0),
          0
        );
        const electricityUsage = monthBills.reduce(
          (sum, bill) => sum + (bill.electricityAmount || 0),
          0
        );
        const waterUsage = monthBills.reduce(
          (sum, bill) => sum + (bill.waterAmount || 0),
          0
        );

        yearlyData.push({
          month: months[i],
          rent: rentRevenue,
          electricity: electricityUsage,
          water: waterUsage,
          salary: monthlyStaffSalary,
        });
      }

      // Calculate yearly totals
      const yearlyTotals = {
        rent: yearlyData.reduce((sum, month) => sum + month.rent, 0),
        electricity: yearlyData.reduce(
          (sum, month) => sum + month.electricity,
          0
        ),
        water: yearlyData.reduce((sum, month) => sum + month.water, 0),
        salary: yearlyData.reduce((sum, month) => sum + month.salary, 0),
      };

      return NextResponse.json({
        monthlyData: yearlyData,
        yearlyTotals: yearlyTotals,
      });
    }
  } catch (error) {
    console.error("Error fetching financial data:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial data" },
      { status: 500 }
    );
  }
}
