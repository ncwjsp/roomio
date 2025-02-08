import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { format } from "date-fns";

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get distinct months from bills
    const bills = await Bill.find({ createdBy: session.user.id }).distinct(
      "month"
    );

    // Convert Date objects to YYYY-MM format
    const formattedMonths = bills
      .map((month) => {
        if (typeof month === "string" && month.match(/^\d{4}-\d{2}$/)) {
          return month; // Already in YYYY-MM format
        }
        try {
          return format(new Date(month), "yyyy-MM");
        } catch (error) {
          console.error("Error formatting month:", month);
          return null;
        }
      })
      .filter(Boolean); // Remove any null values

    // Sort months in descending order
    formattedMonths.sort((a, b) => b.localeCompare(a));

    return NextResponse.json({
      months: formattedMonths,
    });
  } catch (error) {
    console.error("Error fetching months:", error);
    return NextResponse.json(
      { error: "Failed to fetch available months" },
      { status: 500 }
    );
  }
}
