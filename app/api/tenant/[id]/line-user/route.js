import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import LineContact from "@/app/models/LineContact";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PUT(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { lineUserId } = await request.json();
    const params = await context.params;
    const tenantId = params.id;

    if (!lineUserId) {
      return NextResponse.json(
        { error: "LINE User ID is required" },
        { status: 400 }
      );
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    let lineContact = await LineContact.findOne({ userId: lineUserId });
    
    if (!lineContact) {
      lineContact = new LineContact({
        userId: lineUserId,
        isTenant: true,
      });
    }

    lineContact.tenantId = tenant._id;
    await lineContact.save();

    tenant.lineUserId = lineUserId;
    await tenant.save();

    return NextResponse.json({ 
      success: true, 
      tenant,
      lineContact 
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update LINE contact",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
