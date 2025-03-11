import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    // Get all bills for this user
    const bills = await Bill.find({ createdBy: userId });

    // Extract unique years from bills
    const years = [
      ...new Set(bills.map((bill) => bill.month.substring(0, 4))),
    ].sort();

    // If a specific year is requested, return months for that year
    if (year) {
      const monthsInYear = bills
        .filter((bill) => bill.month.startsWith(year))
        .map((bill) => {
          const monthIndex = parseInt(bill.month.substring(5, 7)) - 1;
          const monthNames = [
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
          return monthNames[monthIndex];
        });

      // Get unique months and sort them
      const uniqueMonths = [...new Set(monthsInYear)].sort((a, b) => {
        const monthOrder = {
          Jan: 0,
          Feb: 1,
          Mar: 2,
          Apr: 3,
          May: 4,
          Jun: 5,
          Jul: 6,
          Aug: 7,
          Sep: 8,
          Oct: 9,
          Nov: 10,
          Dec: 11,
        };
        return monthOrder[a] - monthOrder[b];
      });

      return NextResponse.json({ months: uniqueMonths });
    }

    // Otherwise, return all years and months by year
    const monthsByYear = {};
    years.forEach((year) => {
      const monthsInYear = bills
        .filter((bill) => bill.month.startsWith(year))
        .map((bill) => {
          const monthIndex = parseInt(bill.month.substring(5, 7)) - 1;
          const monthNames = [
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
          return monthNames[monthIndex];
        });

      // Get unique months and sort them
      const uniqueMonths = [...new Set(monthsInYear)].sort((a, b) => {
        const monthOrder = {
          Jan: 0,
          Feb: 1,
          Mar: 2,
          Apr: 3,
          May: 4,
          Jun: 5,
          Jul: 6,
          Aug: 7,
          Sep: 8,
          Oct: 9,
          Nov: 10,
          Dec: 11,
        };
        return monthOrder[a] - monthOrder[b];
      });

      monthsByYear[year] = uniqueMonths;
    });

    return NextResponse.json({ years, monthsByYear });
  } catch (error) {
    console.error("Error fetching available data periods:", error);
    return NextResponse.json(
      { error: "Failed to fetch available data periods" },
      { status: 500 }
    );
  }
}
