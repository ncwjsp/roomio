import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import User from "@/app/models/User";
import Tenant from "@/app/models/Tenant";
import { format } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/push";

async function sendLineMessage(lineUserId, bill, lineConfig) {
  try {
    console.log("Sending LINE message to:", lineUserId);
    console.log("Bill data:", JSON.stringify(bill, null, 2));
    console.log("LINE config:", {
      channelAccessToken: lineConfig.channelAccessToken ? "exists" : "missing",
    });

    const flexMessage = {
      to: lineUserId,
      messages: [
        {
          type: "flex",
          altText: `Monthly Bill - ${format(
            new Date(bill.month),
            "MMMM yyyy"
          )}`,
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "Monthly Bill",
                  weight: "bold",
                  size: "xl",
                  color: "#ffffff",
                },
                {
                  type: "text",
                  text: format(new Date(bill.month), "MMMM yyyy"),
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
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "Building",
                      size: "sm",
                      color: "#555555",
                    },
                    {
                      type: "text",
                      text: bill.roomId?.floor?.building?.name || "",
                      size: "sm",
                      align: "end",
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "Room",
                      size: "sm",
                      color: "#555555",
                    },
                    {
                      type: "text",
                      text: bill.roomId?.roomNumber || "",
                      size: "sm",
                      align: "end",
                    },
                  ],
                },
                {
                  type: "separator",
                  margin: "xl",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "xl",
                  contents: [
                    {
                      type: "text",
                      text: "Usage Details",
                      weight: "bold",
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "md",
                      contents: [
                        {
                          type: "text",
                          text: "💧 Water",
                          size: "sm",
                        },
                        {
                          type: "text",
                          text: `${bill.waterUsage || 0} units (฿${(
                            bill.waterAmount || 0
                          ).toLocaleString()})`,
                          size: "sm",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "md",
                      contents: [
                        {
                          type: "text",
                          text: "⚡ Electricity",
                          size: "sm",
                        },
                        {
                          type: "text",
                          text: `${bill.electricityUsage || 0} units (฿${(
                            bill.electricityAmount || 0
                          ).toLocaleString()})`,
                          size: "sm",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "md",
                      contents: [
                        {
                          type: "text",
                          text: "🏠 Room Rent",
                          size: "sm",
                        },
                        {
                          type: "text",
                          text: `฿${(bill.rentAmount || 0).toLocaleString()}`,
                          size: "sm",
                          align: "end",
                        },
                      ],
                    },
                  ],
                },
                ...(bill.additionalFees?.length > 0
                  ? [
                      {
                        type: "separator",
                        margin: "xl",
                      },
                      {
                        type: "box",
                        layout: "vertical",
                        margin: "xl",
                        contents: [
                          {
                            type: "text",
                            text: "Additional Fees",
                            weight: "bold",
                          },
                          ...bill.additionalFees.map((fee) => ({
                            type: "box",
                            layout: "horizontal",
                            margin: "md",
                            contents: [
                              {
                                type: "text",
                                text: fee.name || "",
                                size: "sm",
                              },
                              {
                                type: "text",
                                text: `฿${(
                                  Number(fee.price) || 0
                                ).toLocaleString()}`,
                                size: "sm",
                                align: "end",
                              },
                            ],
                          })),
                        ],
                      },
                    ]
                  : []),
                {
                  type: "separator",
                  margin: "xl",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "xl",
                  contents: [
                    {
                      type: "text",
                      text: "Total Amount",
                      weight: "bold",
                    },
                    {
                      type: "text",
                      text: `฿${(bill.totalAmount || 0).toLocaleString()}`,
                      weight: "bold",
                      align: "end",
                      color: "#898F63",
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
                  text: "Payment Methods",
                  weight: "bold",
                  align: "center",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "Bank Transfer: XXX-X-XXXXX-X",
                      size: "sm",
                      align: "center",
                    },
                    {
                      type: "text",
                      text: "PromptPay: XXXXXXXXXX",
                      size: "sm",
                      align: "center",
                    },
                  ],
                },
                {
                  type: "text",
                  text: "Please pay before the 5th of next month",
                  margin: "xl",
                  size: "xs",
                  align: "center",
                  color: "#888888",
                },
              ],
            },
          },
        },
      ],
    };

    console.log("Sending flex message:", JSON.stringify(flexMessage, null, 2));

    const response = await fetch(LINE_MESSAGING_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lineConfig.channelAccessToken}`,
      },
      body: JSON.stringify(flexMessage),
    });

    const responseData = await response.text();
    console.log("LINE API Response:", {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send LINE message: ${response.status} ${responseData}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error sending LINE message:", {
      error: error.message,
      stack: error.stack,
      lineUserId,
      billId: bill._id,
    });
    throw error;
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const { bills } = await request.json();
    console.log(
      "Received bills:",
      bills.map((b) => b.id)
    );

    // Get the current user's session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("User email:", session.user.email);

    // Get user's LINE configuration
    const user = await User.findOne({ email: session.user.email });
    console.log("Found user:", {
      hasLineConfig: !!user?.lineConfig,
      hasToken: !!user?.lineConfig?.channelAccessToken,
    });

    if (!user?.lineConfig?.channelAccessToken) {
      return NextResponse.json(
        { error: "LINE configuration not found" },
        { status: 400 }
      );
    }

    // Extract just the IDs from the bills array
    const billIds = bills.map((bill) => bill.id);
    console.log("Processing bill IDs:", billIds);

    // Fetch fully populated bills
    const populatedBills = await Bill.find({ _id: { $in: billIds } }).populate({
      path: "roomId",
      populate: {
        path: "floor",
        populate: {
          path: "building",
        },
      },
    });
    console.log("Found populated bills:", populatedBills.length);

    const results = await Promise.all(
      populatedBills.map(async (bill) => {
        // Get tenant's LINE userId from your database
        const tenant = await Tenant.findOne({ room: bill.roomId });
        console.log("Found tenant for room:", {
          roomId: bill.roomId?._id,
          hasLineUserId: !!tenant?.lineUserId,
        });

        if (!tenant?.lineUserId) {
          console.warn(
            `No LINE userId found for tenant in room ${
              bill.roomId?.roomNumber || "unknown"
            }`
          );
          return false;
        }

        return sendLineMessage(tenant.lineUserId, bill, user.lineConfig);
      })
    );

    const successCount = results.filter(Boolean).length;
    console.log("Results:", {
      total: results.length,
      successful: successCount,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${successCount} out of ${populatedBills.length} bills`,
    });
  } catch (error) {
    console.error("Error sending bills:", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to send bills" },
      { status: 500 }
    );
  }
}
