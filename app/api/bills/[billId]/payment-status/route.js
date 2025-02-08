import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const bills = await params;
    const { billId } = bills;
    const updates = await request.json();

    const bill = await Bill.findByIdAndUpdate(
      billId,
      {
        paymentStatus: updates.paymentStatus,
        paymentDate: updates.paymentDate,
      },
      { new: true }
    );

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
