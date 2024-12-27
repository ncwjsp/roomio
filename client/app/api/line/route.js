import * as line from "@line/bot-sdk";
import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Friend from "@/app/models/Friend";

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
});

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body || !body.events) {
      return NextResponse.json(
        { status: "error", message: "Invalid request body" },
        { status: 400 }
      );
    }

    // Process events
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
    const userId = event.source.userId;
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

    const friendData = {
      userId: user.userId,
      name: user.displayName,
      pfp: user.pictureUrl,
      isTenant: false,
    };

    try {
      dbConnect();

      const existingFriend = await Friend.findOne({
        userId: friendData.userId,
      });

      if (!existingFriend) {
        const newFriend = new Friend(friendData);
        await newFriend.save();
        console.log("New friend added:", friendData);
      } else {
        console.log("Friend already exists:", existingFriend);
      }
    } catch (err) {
      console.error("Error saving friend data:", err);
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
