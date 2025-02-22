import * as line from "@line/bot-sdk";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LineContact from "@/app/models/LineContact";
import User from "@/app/models/User";


async function getLineClient(id) {
  await dbConnect();
  const user = await User.findOne({
    _id: id,
  });

  if (!user || !user.lineConfig) {
    throw new Error("LINE configuration not found for user");
  }

  console.log("LINE Config:", {
    accessToken: user.lineConfig.channelAccessToken ? "exists" : "missing",
    channelSecret: user.lineConfig.channelSecret ? "exists" : "missing",
  });

  return {
    client: new line.messagingApi.MessagingApiClient({
      channelAccessToken: user.lineConfig.accessToken,
      channelSecret: user.lineConfig.channelSecret,
    }),
    userId: user._id,
  };
}

async function handleLineContact(lineUserId, landlordId) {
  try {
    const user = await User.findById(landlordId);
    if (!user || !user.lineConfig) {
      throw new Error("User or LINE configuration not found");
    }

    // Fetch LINE user profile
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${lineUserId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.lineConfig.channelAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch LINE profile: ${response.statusText}`);
    }

    const lineUser = await response.json();

    // Validate required fields from LINE API
    if (!lineUser.userId || !lineUser.displayName) {
      throw new Error("Invalid LINE user profile data");
    }

    const lineContactData = {
      userId: lineUser.userId,
      name: lineUser.displayName,
      pfp: lineUser.pictureUrl || "", // Make optional since some users might not have profile pictures
      isTenant: false,
      landlordId: landlordId,
    };

    await dbConnect();

    const existingContact = await LineContact.findOne({
      userId: lineContactData.userId,
      landlordId: landlordId,
    });

    if (!existingContact) {
      const newLineContact = new LineContact(lineContactData);
      await newLineContact.save();
      console.log("New LINE contact added:", lineContactData);
      return { status: "created", contact: newLineContact };
    } else {
      console.log("LINE contact already exists:", existingContact);
      return { status: "exists", contact: existingContact };
    }
  } catch (err) {
    console.error("Error handling LINE contact:", err);
    throw err;
  }
}

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { status: "error", message: "Missing id parameter" },
        { status: 400 }
      );
    }

    const body = await req.json();
    if (!body || !body.events) {
      return NextResponse.json(
        { status: "error", message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { client, userId } = await getLineClient(id);
    const events = body.events;
    await Promise.all(
      events.map((event) => handleEvent(event, userId, client))
    );

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("Error handling webhook:", err);
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}

async function handleEvent(event, landlordId, client) {
  console.log("Event received:", event);

  // Initialize LINE client if not provided
  if (!client) {
    const user = await User.findById(landlordId);
    if (!user || !user.lineConfig) {
      throw new Error("LINE configuration not found for user");
    }

    client = new line.messagingApi.MessagingApiClient({
      channelAccessToken: user.lineConfig.accessToken,
      channelSecret: user.lineConfig.channelSecret,
    });
  }

  if (event.type === "follow") {
    try {
      await handleLineContact(event.source.userId, landlordId);
    } catch (err) {
      console.error("Error in follow event:", err);
    }
  }

  if (event.type === "message" && event.message.text === "bro") {
    console.log("Replying to message:", event.replyToken);

    const echo = {
      type: "text",
      text: event.message.text,
    };

    try {
      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [echo],
      });
    } catch (err) {
      console.error("Error replying to message:", err);
    }
  }
}
