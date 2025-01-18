import dbConnect from "@/lib/mongodb";
import LineContact from "@/app/models/LineContact";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    const lineContacts = await LineContact.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ lineContacts });
  } catch (error) {
    console.error("Error fetching LINE contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch LINE contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await dbConnect();

    const newLineContact = new LineContact(body);
    await newLineContact.save();

    return NextResponse.json(
      {
        message: "LINE contact added successfully",
        lineContact: newLineContact,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding LINE contact:", error);
    return NextResponse.json(
      { error: "Failed to add LINE contact" },
      { status: 500 }
    );
  }
}
