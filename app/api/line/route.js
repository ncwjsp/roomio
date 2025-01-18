import * as line from "@line/bot-sdk";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LineContact from "@/app/models/LineContact";

// const config = {
//   channelSecret: process.env.CHANNEL_SECRET,
// };

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
});

async function handleLineContact(userId) {
  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );

    const user = await response.json();

    const lineContactData = {
      userId: user.userId,
      name: user.displayName,
      pfp: user.pictureUrl,
      isTenant: false,
    };

    await dbConnect();

    const existingContact = await LineContact.findOne({
      userId: lineContactData.userId,
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
    const body = await req.json();
    if (!body || !body.events) {
      return NextResponse.json(
        { status: "error", message: "Invalid request body" },
        { status: 400 }
      );
    }

    const events = body.events;
    await Promise.all(events.map(handleEvent));

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("Error handling webhook:", err);
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}

async function handleEvent(event) {
  console.log("Event received:", event);

  if (event.type === "follow") {
    try {
      await handleLineContact(event.source.userId);
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

async function getAllFriends() {
  const friends = await Friend.find({});
  return friends;
}
