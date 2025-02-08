import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Bill from "@/app/models/Bill";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    // Get all active tenants
    const activeTenants = await Tenant.find({
      landlordId: session.user.id,
      active: true,
    });

    // Get all bills for the current month
    const bills = await Bill.find({
      month: month,
    });

    // Find tenants who don't have a bill for this month
    const tenantsWithoutBills = activeTenants.filter(
      (tenant) =>
        !bills.some(
          (bill) =>
            bill.roomId &&
            tenant.room &&
            bill.roomId.toString() === tenant.room.toString()
        )
    );

    const response = {
      hasNewTenants: tenantsWithoutBills.length > 0,
      count: tenantsWithoutBills.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking for tenants without bills:", error);
    return NextResponse.json(
      { error: "Failed to check for tenants without bills" },
      { status: 500 }
    );
  }
}
