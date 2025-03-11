import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const bills = await params;
    const { billId } = bills;
    const updates = await request.json();

    // Find the bill first
    const bill = await Bill.findById(billId);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Update payment status and date
    bill.paymentStatus = updates.paymentStatus;
    bill.paymentDate = updates.paymentDate;

    // Recalculate amounts using the model's method
    bill.calculateAmounts();

    // Save the updated bill
    await bill.save();

    // Populate necessary fields for the response
    await bill.populate({
      path: "roomId",
      select: "roomNumber floor",
      populate: {
        path: "floor",
        select: "building",
        populate: {
          path: "building",
          select: "name",
        },
      },
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
