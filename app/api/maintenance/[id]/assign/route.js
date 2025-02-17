import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/app/models/Maintenance";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sendMaintenanceNotification } from "@/lib/notifications";

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await params;
    const { technicianId } = await request.json();

    const maintenance = await Maintenance.findByIdAndUpdate(
      data.id,
      {
        $set: { staff: technicianId },
        currentStatus: "In Progress",
        $push: {
          statusHistory: {
            status: "In Progress",
            comment: `Assigned to technician`,
            updatedAt: new Date(),
            updatedByModel: "User",
            updatedBy: session.user.id,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate([
      {
        path: "staff",
        select: "firstName lastName specialization",
      },
      {
        path: "room",
        populate: [
          {
            path: "floor",
            populate: {
              path: "building",
            },
          },
          {
            path: "tenant",
            select: "name lineUserId",
          },
        ],
      },
    ]);

    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance request not found" },
        { status: 404 }
      );
    }

    // Send Line notification
    await sendMaintenanceNotification({
      userId: session.user.id,
      maintenance,
      status: "In Progress",
      comment: `Assigned to ${maintenance.staff.firstName} ${maintenance.staff.lastName}`,
    });

    return NextResponse.json({ ticket: maintenance });
  } catch (error) {
    console.error("Error assigning technician:", error);
    return NextResponse.json(
      { error: "Failed to assign technician" },
      { status: 500 }
    );
  }
}
