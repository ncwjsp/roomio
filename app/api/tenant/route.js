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

    await dbConnect();
    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "room",
      "fromDate",
      "toDate",
      "depositAmount",
      "lineId",
      "lineUserId",
      "initialMeterReadings",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate and update room status
    const room = await Room.findById(data.room).populate({
      path: "floor",
      populate: {
        path: "building",
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.status === "Occupied") {
      return NextResponse.json(
        { error: "Room is already occupied" },
        { status: 400 }
      );
    }

    // Create tenant
    const tenant = await Tenant.create({
      ...data,
      createdBy: session.user.id,
      leaseStartDate: new Date(data.fromDate),
      leaseEndDate: new Date(data.toDate),
      status: "Active",
      initialMeterReadings: {
        water: parseFloat(data.initialMeterReadings.water),
        electricity: parseFloat(data.initialMeterReadings.electricity),
      },
    });

    // Update room with new readings and tenant
    await Room.findByIdAndUpdate(data.room, {
      status: "Occupied",
      tenant: tenant._id,
      currentMeterReadings: {
        water: parseFloat(data.initialMeterReadings.water),
        electricity: parseFloat(data.initialMeterReadings.electricity),
        lastUpdated: new Date(),
      },
    });

    // Find the LINE contact
    const lineContact = await LineContact.findOne({ userId: data.lineUserId });

    if (!lineContact) {
      return NextResponse.json(
        { error: "LINE contact not found" },
        { status: 404 }
      );
    }

    // Update the LINE contact
    await LineContact.findByIdAndUpdate(lineContact._id, {
      isTenant: true,
      tenantId: tenant._id,
    });

    // Get LINE client and user config
    const user = await User.findById(session.user.id);
    const client = await getLineClient(session.user.id);

    // Send welcome message with tenant details
    try {
      if (!user.lineConfig?.tenantRichMenuId) {
        throw new Error("Tenant rich menu ID not configured");
      }

      await client.linkRichMenuToUser(
        data.lineUserId,
        user.lineConfig.tenantRichMenuId
      );

      // Now room.floor.building.name should be available
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
            backgroundColor: "#898F63",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `Dear ${data.name},`,
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
                        text: room.floor.building.name || "N/A",
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
                          data.fromDate
                        ).toLocaleDateString()} - ${new Date(
                          data.toDate
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
                        text: `฿${data.depositAmount.toLocaleString()}`,
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

      await client.pushMessage(data.lineUserId, welcomeMessage);
    } catch (lineError) {
      console.error("Error with LINE operations:", lineError);
      // Continue with tenant creation even if LINE operations fail
    }

    return NextResponse.json({
      message: "Tenant created successfully",
      tenant,
    });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create tenant" },
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
