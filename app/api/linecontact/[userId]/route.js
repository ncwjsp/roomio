import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LineContact from "@/app/models/LineContact";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { userId } = params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const lineContact = await LineContact.findOne({ userId });

    if (!lineContact) {
      return NextResponse.json(
        { error: "LINE contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ lineContact });
  } catch (error) {
    console.error("Error fetching LINE contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch LINE contact" },
      { status: 500 }
    );
  }
}
