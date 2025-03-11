import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import Staff from "@/app/models/Staff";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { format } from "date-fns";

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

      console.log(`Fetching data for month: ${monthFormatted}`);

      // Get all paid bills for the month
      const paidBills = await Bill.find({
        createdBy: userId,
        month: monthFormatted,
        paymentStatus: "paid",
      });

      console.log(`Found ${paidBills.length} paid bills`);

      // Get all bills for the month (paid or not) for utility calculations
      const allBills = await Bill.find({
        createdBy: userId,
        month: monthFormatted,
      });

      console.log(`Found ${allBills.length} total bills`);

      // Calculate total rent revenue (including additional fees from paid bills)
      const totalRentRevenue = paidBills.reduce((sum, bill) => {
        const additionalFeesTotal = Array.isArray(bill.additionalFees)
          ? bill.additionalFees.reduce(
              (feeSum, fee) => feeSum + (Number(fee.price) || 0),
              0
            )
          : 0;
        return sum + (Number(bill.rentAmount) || 0) + additionalFeesTotal;
      }, 0);

      // Calculate total electricity and water usage from all bills
      const totalElectricityUsage = allBills.reduce(
        (sum, bill) => sum + (Number(bill.electricityAmount) || 0),
        0
      );
      const totalWaterUsage = allBills.reduce(
        (sum, bill) => sum + (Number(bill.waterAmount) || 0),
        0
      );

      // Get staff salary for the month
      const staffMembers = await Staff.find({ landlordId: userId });
      const totalStaffSalary = staffMembers.reduce(
        (sum, staff) => sum + (Number(staff.salary) || 0),
        0
      );

      console.log({
        rentRevenue: totalRentRevenue,
        electricityUsage: totalElectricityUsage,
        waterUsage: totalWaterUsage,
        staffSalary: totalStaffSalary,
      });

      // Create monthly data for the chart
      const monthlyData = [
        {
          month,
          rent: totalRentRevenue,
          electricity: totalElectricityUsage,
          water: totalWaterUsage,
          salary: totalStaffSalary,
        },
      ];

      return NextResponse.json({
        summary: {
          rentRevenue: totalRentRevenue,
          electricityUsage: totalElectricityUsage,
          waterUsage: totalWaterUsage,
          staffSalary: totalStaffSalary,
        },
        monthlyData: monthlyData,
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

      // Get staff members once for the whole year
      const staffMembers = await Staff.find({ landlordId: userId });
      const monthlyStaffSalary = staffMembers.reduce(
        (sum, staff) => sum + (Number(staff.salary) || 0),
        0
      );

      // Process each month
      for (const month of months) {
        const monthIndex = months.indexOf(month) + 1;
        const monthStr = String(monthIndex).padStart(2, "0");
        const monthFormatted = `${year}-${monthStr}`;

        // Filter bills for this month
        const monthBills = yearBills.filter(
          (bill) => bill.month === monthFormatted
        );
        const paidMonthBills = monthBills.filter(
          (bill) => bill.paymentStatus === "paid"
        );

        // Calculate totals for this month
        const rentRevenue = paidMonthBills.reduce((sum, bill) => {
          const additionalFeesTotal = Array.isArray(bill.additionalFees)
            ? bill.additionalFees.reduce(
                (feeSum, fee) => feeSum + (Number(fee.price) || 0),
                0
              )
            : 0;
          return sum + (Number(bill.rentAmount) || 0) + additionalFeesTotal;
        }, 0);

        const electricityAmount = monthBills.reduce(
          (sum, bill) => sum + (Number(bill.electricityAmount) || 0),
          0
        );

        const waterAmount = monthBills.reduce(
          (sum, bill) => sum + (Number(bill.waterAmount) || 0),
          0
        );

        yearlyData.push({
          month,
          rent: rentRevenue,
          electricity: electricityAmount,
          water: waterAmount,
          salary: monthlyStaffSalary,
        });
      }

      console.log("Yearly data:", yearlyData);

      return NextResponse.json({
        monthlyData: yearlyData,
        yearlyTotals: {
          rentRevenue: yearlyData.reduce((sum, month) => sum + month.rent, 0),
          electricityUsage: yearlyData.reduce(
            (sum, month) => sum + month.electricity,
            0
          ),
          waterUsage: yearlyData.reduce((sum, month) => sum + month.water, 0),
          staffSalary: yearlyData.reduce((sum, month) => sum + month.salary, 0),
        },
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
