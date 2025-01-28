import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tenant from "@/app/models/Tenant";
import Room from "@/app/models/Room";
import LineContact from "@/app/models/LineContact";
import User from "@/app/models/User";
import Building from "@/app/models/Building";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Floor from "@/app/models/Floor";
import { getLineClient } from "@/lib/line";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await dbConnect();

    // Find the LINE contact
    const lineContact = await LineContact.findOne({ userId: body.lineUserId });

    if (!lineContact) {
      return NextResponse.json(
        { error: "LINE contact not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    const requiredFields = [
      "name",
      "email",
      "phone",
      "lineId",
      "room",
      "depositAmount",
      "leaseStartDate",
      "leaseEndDate",
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missingFields,
        },
        { status: 400 }
      );
    }

    // Verify room exists and belongs to the current user's buildings
    const room = await Room.findById(body.room).populate({
      path: "floor",
      populate: {
        path: "building",
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if room belongs to the current user
    if (room.floor.building.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to add tenant to this room" },
        { status: 403 }
      );
    }

    // Check if room is available
    if (room.status === "Occupied") {
      return NextResponse.json(
        { error: "Room is already occupied" },
        { status: 400 }
      );
    }

    // Create new tenant with landlordId
    const tenantData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      lineId: body.lineId,
      lineUserId: lineContact.userId,
      room: body.room,
      depositAmount: body.depositAmount,
      leaseStartDate: body.leaseStartDate,
      leaseEndDate: body.leaseEndDate,
      pfp: body.pfp || lineContact.pfp,
      landlordId: session.user.id, // Add landlordId from session
    };

    const newTenant = new Tenant(tenantData);
    await newTenant.save();

    // Update the LINE contact
    await LineContact.findByIdAndUpdate(lineContact._id, {
      isTenant: true,
      tenantId: newTenant._id,
    });

    // Update room status
    await Room.findByIdAndUpdate(body.room, {
      tenant: newTenant._id,
      status: "Occupied",
    });

    // Get LINE client and user config
    const user = await User.findById(session.user.id);
    const client = await getLineClient(session.user.id);

    // Attach tenant rich menu using the ID from user's config
    try {
      if (!user.lineConfig?.tenantRichMenuId) {
        throw new Error("Tenant rich menu ID not configured");
      }

      await client.linkRichMenuToUser(
        lineContact.userId,
        user.lineConfig.tenantRichMenuId // Use the ID from user's config
      );

      // Send welcome message with tenant details
      const welcomeMessage = {
        type: "flex",
        altText: "Welcome to your new home!",
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "Welcome to your new home!",
                weight: "bold",
                size: "lg",
                color: "#ffffff",
              },
            ],
            backgroundColor: "#27ae60",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `Dear ${body.name},`,
                weight: "bold",
                size: "md",
                wrap: true,
              },
              {
                type: "text",
                text: "Your tenancy details:",
                margin: "md",
              },
              {
                type: "box",
                layout: "vertical",
                margin: "md",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "Building:",
                        size: "sm",
                        color: "#555555",
                        flex: 2,
                      },
                      {
                        type: "text",
                        text: `${room.floor.building.name}`,
                        size: "sm",
                        flex: 4,
                        wrap: true,
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "Room:",
                        size: "sm",
                        color: "#555555",
                        flex: 2,
                      },
                      {
                        type: "text",
                        text: `${room.roomNumber}`,
                        size: "sm",
                        flex: 4,
                        wrap: true,
                      },
                    ],
                    margin: "md",
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "Period:",
                        size: "sm",
                        color: "#555555",
                        flex: 2,
                      },
                      {
                        type: "text",
                        text: `${new Date(
                          body.leaseStartDate
                        ).toLocaleDateString()} - ${new Date(
                          body.leaseEndDate
                        ).toLocaleDateString()}`,
                        size: "sm",
                        flex: 4,
                        wrap: true,
                      },
                    ],
                    margin: "md",
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "Deposit:",
                        size: "sm",
                        color: "#555555",
                        flex: 2,
                      },
                      {
                        type: "text",
                        text: `฿${body.depositAmount.toLocaleString()}`,
                        size: "sm",
                        flex: 4,
                      },
                    ],
                    margin: "md",
                  },
                ],
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "You can now access tenant features through the menu below.",
                size: "xs",
                wrap: true,
                color: "#888888",
              },
            ],
          },
        },
      };

      await client.pushMessage(lineContact.userId, welcomeMessage);
    } catch (lineError) {
      console.error("Error with LINE operations:", lineError);
      // Continue with tenant creation even if LINE operations fail
    }

    // Populate and return the new tenant
    const populatedTenant = await Tenant.findById(newTenant._id).populate({
      path: "room",
      populate: {
        path: "floor",
        populate: {
          path: "building",
        },
      },
    });

    return NextResponse.json(populatedTenant, { status: 201 });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json(
      {
        error: "Failed to create tenant",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get all buildings owned by the current user
    const userBuildings = await Building.find({ createdBy: session.user.id });

    const buildingIds = userBuildings.map((b) => b._id);

    // Get all floors in these buildings
    const floors = await Floor.find({ building: { $in: buildingIds } });

    const floorIds = floors.map((f) => f._id);

    // Get all rooms in these floors
    const rooms = await Room.find({ floor: { $in: floorIds } });

    const roomIds = rooms.map((r) => r._id);

    // Get all tenants in these rooms
    const tenants = await Tenant.find({ room: { $in: roomIds } }).populate({
      path: "room",
      populate: {
        path: "floor",
        populate: {
          path: "building",
        },
      },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("Error in GET /api/tenant:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}
