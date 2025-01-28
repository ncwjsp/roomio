import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Announcement from "@/app/models/Announcement";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import User from "@/app/models/User";
import Tenant from "@/app/models/Tenant";

const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/push";

async function sendLineAnnouncement(lineUserId, announcement, lineConfig) {
  try {
    const flexMessage = {
      to: lineUserId,
      messages: [
        {
          type: "flex",
          altText: announcement.title,
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "📢 Announcement",
                  weight: "bold",
                  size: "xl",
                  color: "#ffffff",
                },
              ],
              backgroundColor: "#898F63",
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: announcement.title,
                  weight: "bold",
                  size: "lg",
                  wrap: true,
                },
                {
                  type: "text",
                  text: announcement.content,
                  margin: "md",
                  wrap: true,
                },
              ],
            },
          },
        },
      ],
    };

    const response = await fetch(LINE_MESSAGING_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lineConfig.channelAccessToken}`,
      },
      body: JSON.stringify(flexMessage),
    });

    if (!response.ok) {
      throw new Error("Failed to send LINE message");
    }

    return true;
  } catch (error) {
    console.error("Error sending LINE announcement:", error);
    return false;
  }
}

export async function GET() {
  try {
    await dbConnect();
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");
    return NextResponse.json({ announcements });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user?.lineConfig?.channelAccessToken) {
      return NextResponse.json(
        { error: "LINE configuration not found" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const announcement = await Announcement.create({
      ...data,
      createdBy: user._id,
    });

    // Send announcement to all tenants
    const tenants = await Tenant.find({ lineUserId: { $exists: true } });
    const sendPromises = tenants.map((tenant) =>
      sendLineAnnouncement(tenant.lineUserId, announcement, user.lineConfig)
    );
    await Promise.all(sendPromises);

    return NextResponse.json(announcement);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
