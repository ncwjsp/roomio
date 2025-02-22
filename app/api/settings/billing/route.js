import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, we'll return default settings since we don't have a separate settings model
    const settings = {
      utilities: {
        water: {
          pricePerUnit: "",
          unit: "cubic meter",
        },
        electricity: {
          pricePerUnit: "",
          unit: "kWh",
        },
        billingCycleDate: "",
        latePaymentFee: "",
        selectedBuilding: "",
      },
      commonFees: {
        basePrice: "",
        cleaningFee: "",
        securityFee: "",
        parkingFee: "",
      },
      lateFees: {
        percentage: "",
        gracePeriod: "",
        maxAmount: "",
      },
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching billing settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings } = await request.json();

    // For now, we'll just return success since we don't have a separate settings model
    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating billing settings:", error);
    return NextResponse.json(
      { error: "Failed to update billing settings" },
      { status: 500 }
    );
  }
}
