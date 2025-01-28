import { Client } from "@line/bot-sdk";
import { NextResponse } from "next/server";
import fetch from "node-fetch";

export async function POST(request) {
  try {
    const { channelAccessToken, channelSecret, liffIds } = await request.json();

    const client = new Client({
      channelAccessToken,
      channelSecret,
    });

    // Tenant Rich Menu object (3x2 grid)
    const tenantRichMenu = {
      size: {
        width: 2500,
        height: 1686,
      },
      selected: true,
      name: "Roomio Tenant Menu",
      chatBarText: "Menu",
      areas: [
        {
          bounds: {
            x: 0,
            y: 0,
            width: 833,
            height: 843,
          },
          action: {
            type: "uri",
            uri: `https://liff.line.me/${liffIds.cleaning}`,
            label: "Cleaning",
          },
        },
        {
          bounds: {
            x: 833,
            y: 0,
            width: 833,
            height: 843,
          },
          action: {
            type: "uri",
            uri: `https://liff.line.me/${liffIds.maintenance}`,
            label: "Maintenance",
          },
        },
        {
          bounds: {
            x: 1666,
            y: 0,
            width: 834,
            height: 843,
          },
          action: {
            type: "uri",
            uri: `https://liff.line.me/${liffIds.reports}`,
            label: "Reports",
          },
        },
        {
          bounds: {
            x: 0,
            y: 843,
            width: 833,
            height: 843,
          },
          action: {
            type: "uri",
            uri: `https://liff.line.me/${liffIds.parcels}`,
            label: "Parcels",
          },
        },
        {
          bounds: {
            x: 833,
            y: 843,
            width: 833,
            height: 843,
          },
          action: {
            type: "uri",
            uri: `https://liff.line.me/${liffIds.billing}`,
            label: "Billing",
          },
        },
        {
          bounds: {
            x: 1666,
            y: 843,
            width: 834,
            height: 843,
          },
          action: {
            type: "uri",
            uri: `https://liff.line.me/${liffIds.announcement}`,
            label: "Announcement",
          },
        },
      ],
    };

    // Staff Rich Menu object (2x1 grid)
    const staffRichMenu = {
      size: {
        width: 2500,
        height: 843, // Half height
      },
      selected: true,
      name: "Roomio Staff Menu",
      chatBarText: "Staff Menu",
      areas: [
        {
          bounds: {
            x: 0,
            y: 0,
            width: 1250, // Half width (2500/2)
            height: 843,
          },
          action: {
            type: "uri",
            uri: `https://liff.line.me/${liffIds.schedule}`,
            label: "Schedule",
          },
        },
        {
          bounds: {
            x: 1250, // Start from middle
            y: 0,
            width: 1250, // Half width (2500/2)
            height: 843,
          },
          action: {
            type: "uri",
            uri: `https://liff.line.me/${liffIds.tasks}`,
            label: "Tasks",
          },
        },
      ],
    };

    // Create both rich menus
    const tenantRichMenuId = await client.createRichMenu(tenantRichMenu);
    const staffRichMenuId = await client.createRichMenu(staffRichMenu);

    // Fetch and upload rich menu images from URLs
    const tenantImageUrl =
      "https://roomio-storage.s3.ap-southeast-1.amazonaws.com/tenant-rich-menu.jpg";
    const staffImageUrl =
      "https://roomio-storage.s3.ap-southeast-1.amazonaws.com/staff-rich-menu.jpg";

    // Upload rich menu images
    const uploadRichMenuImage = async (richMenuId, imageUrl) => {
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from ${imageUrl}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();

        // Make direct API call instead of using client.setRichMenuImage
        const response = await fetch(
          `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${channelAccessToken}`,
              "Content-Type": "image/jpeg",
            },
            body: Buffer.from(imageBuffer),
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to upload image: ${errorData}`);
        }
      } catch (error) {
        console.error(`Error uploading rich menu image: ${error.message}`);
        throw error;
      }
    };

    // Upload both images
    await uploadRichMenuImage(tenantRichMenuId, tenantImageUrl);
    await uploadRichMenuImage(staffRichMenuId, staffImageUrl);

    // Set tenant menu as default
    await client.setDefaultRichMenu(tenantRichMenuId);

    return NextResponse.json(
      {
        tenantRichMenuId,
        staffRichMenuId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating rich menus:", error);
    return NextResponse.json(
      { error: "Failed to create rich menus" },
      { status: 500 }
    );
  }
}
