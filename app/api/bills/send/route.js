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
    console.log("📱 Starting LINE message send:", {
      lineUserId,
      billId: bill._id,
      room: bill.roomId?.roomNumber,
    });

    // Populate bill with room, floor, and building details
    const populatedBill = await Bill.findById(bill._id)
      .populate({
        path: 'roomId',
        populate: {
          path: 'floor',
          populate: {
            path: 'building'
          }
        }
      });

    // Calculate additional fees total
    const additionalFeesTotal = populatedBill.additionalFees?.reduce((sum, fee) => 
      sum + (Number(fee.price) || 0), 0
    ) || 0;

    const flexMessage = {
      to: lineUserId,
      messages: [
        {
          type: "flex",
          altText: `Monthly Bill - ${format(
            new Date(populatedBill.month),
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
                  text: format(new Date(populatedBill.month), "MMMM yyyy"),
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
                      text: populatedBill.roomId?.floor?.building?.name || "N/A",
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
                      text: populatedBill.roomId?.roomNumber || "N/A",
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
                          text: `${populatedBill.waterUsage || 0} units (฿${
                            populatedBill.waterAmount || 0
                          })`,
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
                          text: `${populatedBill.electricityUsage || 0} units (฿${
                            populatedBill.electricityAmount || 0
                          })`,
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
                          text: `฿${
                            populatedBill.actualRentAmount || populatedBill.rentAmount || 0
                          }`,
                          size: "sm",
                          align: "end",
                        },
                      ],
                    },
                    // Add additional fees section if there are any
                    ...(additionalFeesTotal > 0 ? [{
                      type: "box",
                      layout: "horizontal",
                      margin: "md",
                      contents: [
                        {
                          type: "text",
                          text: "📋 Additional Fees",
                          size: "sm",
                        },
                        {
                          type: "text",
                          text: `฿${additionalFeesTotal}`,
                          size: "sm",
                          align: "end",
                        },
                      ],
                    }] : []),
                  ],
                },
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
                      text: `฿${populatedBill.totalAmount || 0}`,
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
                  text: "Please pay before the due date",
                  size: "sm",
                  align: "center",
                  color: "#888888",
                },
                {
                  type: "text",
                  text: format(new Date(populatedBill.dueDate), "MMMM d, yyyy"),
                  margin: "sm",
                  size: "sm",
                  align: "center",
                  color: "#888888",
                },
              ],
            },
          },
        },
      ],
    };

    console.log("📨 Sending to LINE API with config:", {
      url: LINE_MESSAGING_API,
      hasToken: !!lineConfig.channelAccessToken,
      messageLength: JSON.stringify(flexMessage).length,
    });

    const response = await fetch(LINE_MESSAGING_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lineConfig.channelAccessToken}`,
      },
      body: JSON.stringify(flexMessage),
    });

    const responseText = await response.text();
    console.log("📬 LINE API Raw Response:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log("⚠️ Could not parse LINE response as JSON");
    }

    console.log("📫 LINE API Response Details:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData || responseText,
    });

    if (!response.ok) {
      throw new Error(`LINE API Error: ${response.status} - ${responseText}`);
    }

    console.log("✅ LINE message sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Error in sendLineMessage:", {
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
    console.log("🟢 POST /api/bills/send started");
    await dbConnect();

    const body = await request.json();
    console.log("📦 Request body:", body);

    const { bills } = body;
    if (!bills || !Array.isArray(bills)) {
      console.error("❌ Invalid bills data:", bills);
      return NextResponse.json(
        { error: "Invalid bills data" },
        { status: 400 }
      );
    }
    console.log(
      "📝 Processing bills:",
      bills.map((b) => b.id)
    );

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error("❌ No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("👤 User email:", session.user.email);

    // Get user's LINE configuration
    const user = await User.findOne({ email: session.user.email });
    console.log("👤 User LINE config:", {
      hasConfig: !!user?.lineConfig,
      hasToken: !!user?.lineConfig?.channelAccessToken,
      userId: user?._id,
    });

    if (!user?.lineConfig?.channelAccessToken) {
      console.error("❌ No LINE config found for user");
      return NextResponse.json(
        { error: "LINE configuration not found" },
        { status: 400 }
      );
    }

    // Log what's being sent to the frontend
    console.log("🔄 Selected bills for sending:", {
      count: bills.length,
      ids: bills.map((b) => b.id),
    });

    // Extract just the IDs from the bills array
    const billIds = bills.map((bill) => bill.id);

    // Fetch fully populated bills
    const populatedBills = await Bill.find({ _id: { $in: billIds } }).populate({
      path: "roomId",
      populate: [
        {
          path: "floor",
          populate: {
            path: "building",
            select: "name",
          },
        },
        {
          path: "tenant",
        },
      ],
    });

    console.log("📄 Found populated bills:", {
      requested: billIds.length,
      found: populatedBills.length,
      bills: populatedBills.map((b) => ({
        id: b._id,
        room: b.roomId?.roomNumber,
        building: b.roomId?.floor?.building?.name,
        hasRoom: !!b.roomId,
        hasFloor: !!b.roomId?.floor,
        hasBuilding: !!b.roomId?.floor?.building,
      })),
    });

    const results = await Promise.all(
      populatedBills.map(async (bill) => {
        try {
          // Only update the paymentStatus, preserve all other values
          const updatedBill = await Bill.findByIdAndUpdate(
            bill._id,
            {
              $set: {
                paymentStatus: "pending",
                waterAmount: bill.waterUsage * bill.waterRate,
                electricityAmount: bill.electricityUsage * bill.electricityRate,
                waterUsage: bill.waterUsage,
                electricityUsage: bill.electricityUsage,
                rentAmount: bill.rentAmount,
                actualRentAmount: bill.actualRentAmount,
                totalAmount:
                  (bill.actualRentAmount || bill.rentAmount) +
                  bill.waterUsage * bill.waterRate +
                  bill.electricityUsage * bill.electricityRate +
                  (bill.additionalFees?.reduce(
                    (sum, fee) => sum + (fee.price || 0),
                    0
                  ) || 0),
                additionalFees: bill.additionalFees || [],
                waterRate: bill.waterRate,
                electricityRate: bill.electricityRate,
              },
            },
            { new: true }
          );

          console.log("🏠 Processing bill for room:", {
            billId: updatedBill._id,
            room: updatedBill.roomId?.roomNumber,
            building: updatedBill.roomId?.floor?.building?.name,
          });

          // Get tenant's LINE userId
          const tenant = await Tenant.findOne({ room: updatedBill.roomId });
          console.log("👥 Found tenant:", {
            hasLineId: !!tenant?.lineUserId,
            room: updatedBill.roomId?.roomNumber,
          });

          if (!tenant?.lineUserId) {
            console.warn(
              "⚠️ No LINE userId for tenant in room",
              updatedBill.roomId?.roomNumber
            );
            return false;
          }

          // Try to send the message
          console.log("📤 Attempting to send LINE message");
          const sent = await sendLineMessage(
            tenant.lineUserId,
            updatedBill,
            user.lineConfig
          );
          console.log("✅ LINE message sent:", sent);
          return sent;
        } catch (error) {
          console.error("❌ Error processing bill:", {
            billId: bill._id,
            error: error.message,
          });
          return false;
        }
      })
    );

    const successCount = results.filter(Boolean).length;
    console.log("🏁 Final results:", {
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${successCount} out of ${populatedBills.length} bills`,
    });
  } catch (error) {
    console.error("❌ Error in POST route:", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to send bills" },
      { status: 500 }
    );
  }
}
