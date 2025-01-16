import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";

// Get single tenant
export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise;

  try {
    await dbConnect();
    const tenant = await Tenant.findById(params.id).populate("room");

    if (!tenant) {
      return NextResponse.json(
        { message: "Tenant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant }, { status: 200 });
  } catch (error) {
    console.error("Error in tenant GET API:", error);
    return NextResponse.json(
      { message: "Failed to fetch tenant" },
      { status: 500 }
    );
  }
}

// Update tenant
export async function PUT(request, { params: paramsPromise }) {
  const params = await paramsPromise;

  try {
    await dbConnect();
    const data = await request.json();

    const tenant = await Tenant.findByIdAndUpdate(
      params.id,
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
        lineId: data.lineId,
        depositAmount: data.depositAmount,
        leaseStartDate: new Date(data.leaseStartDate),
        leaseEndDate: new Date(data.leaseEndDate),
      },
      { new: true }
    ).populate("room");

    if (!tenant) {
      return NextResponse.json(
        { message: "Tenant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant }, { status: 200 });
  } catch (error) {
    console.error("Error in tenant PUT API:", error);
    return NextResponse.json(
      { message: "Failed to update tenant" },
      { status: 500 }
    );
  }
}

// Delete tenant
export async function DELETE(request, { params: paramsPromise }) {
  const params = await paramsPromise;

  try {
    await dbConnect();
    const tenant = await Tenant.findById(params.id);

    if (!tenant) {
      return NextResponse.json(
        { message: "Tenant not found" },
        { status: 404 }
      );
    }

    // Update room status first
    await Room.findByIdAndUpdate(tenant.room, {
      status: "Available",
      tenant: null,
    });

    // Then delete the tenant
    await Tenant.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: "Tenant deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in tenant DELETE API:", error);
    return NextResponse.json(
      { message: "Failed to delete tenant" },
      { status: 500 }
    );
  }
}
