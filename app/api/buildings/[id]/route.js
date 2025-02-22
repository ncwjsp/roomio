import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Building from "@/app/models/Building";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const building = await Building.findOne({
      _id: id,
      createdBy: session.user.id
    });

    if (!building) {
      return NextResponse.json({ error: "Building not found" }, { status: 404 });
    }

    return NextResponse.json({ building });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch building" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    

    const { id } = await params;
    const data = await request.json();

    // Check if another building with the same name exists for this user
    const existingBuilding = await Building.findOne({
      _id: { $ne: id }, // Exclude current building
      createdBy: session.user.id,
      name: data.name
    });

    if (existingBuilding) {
      return NextResponse.json(
        { error: "A building with this name already exists" },
        { status: 400 }
      );
    }

    const building = await Building.findOneAndUpdate(
      { 
        _id: id,
        createdBy: session.user.id 
      },
      { 
        name: data.name,
        waterRate: data.waterRate,
        electricityRate: data.electricityRate,
        billingConfig: data.billingConfig
      },
      { new: true }
    );

    if (!building) {
      return NextResponse.json({ error: "Building not found" }, { status: 404 });
    }

    return NextResponse.json({ building });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update building" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const building = await Building.findOneAndDelete({
      _id: id,
      createdBy: session.user.id
    });

    if (!building) {
      return NextResponse.json({ error: "Building not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Building deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete building" },
      { status: 500 }
    );
  }
}
