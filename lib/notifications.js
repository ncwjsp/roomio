import { format } from "date-fns";
import { sendLineMessage } from "./line";

export async function sendMaintenanceNotification({
  userId,
  maintenance,
  status,
  comment,
}) {
  try {
    console.log("Notification data:", {
      userId,
      roomData: {
        hasRoom: !!maintenance.room,
        roomNumber: maintenance.room?.roomNumber,
        buildingName: maintenance.room?.floor?.building?.name
      },
      status,
      comment
    });

    // Skip if userId looks like a MongoDB ObjectId (24 hex chars)
    if (userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error(`LINE user ID appears to be a MongoDB ObjectId: ${userId}`);
    }

    // Get the channel access token from the landlord's line config
    const channelAccessToken = maintenance.room?.createdBy?.lineConfig?.channelAccessToken;
    if (!channelAccessToken) {
      throw new Error(`No LINE channel access token found for landlord`);
    }

    const buildingName = maintenance.room?.floor?.building?.name;
    const roomNumber = maintenance.room?.roomNumber;
    const formattedDate = format(new Date(), "MMMM d, yyyy 'at' h:mm a");

    console.log("Creating message for room:", roomNumber);

    // Create the message with proper error handling for missing data
    const message = {
      to: userId,
      messages: [{
        type: "flex",
        altText: `Maintenance Status Update for Room ${roomNumber || 'Unknown'}`,
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "Maintenance Status Update",
                weight: "bold",
                size: "lg",
                color: "#ffffff"
              }
            ],
            backgroundColor: "#898F63"
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: maintenance.problem || comment || "Maintenance update",
                weight: "bold",
                wrap: true
              },
              {
                type: "box",
                layout: "vertical",
                margin: "lg",
                spacing: "sm",
                contents: [
                  {
                    type: "box",
                    layout: "baseline",
                    spacing: "sm",
                    contents: [
                      {
                        type: "text",
                        text: "Building",
                        color: "#aaaaaa",
                        size: "sm",
                        flex: 2
                      },
                      {
                        type: "text",
                        text: buildingName || "Unknown",
                        wrap: true,
                        size: "sm",
                        flex: 4
                      }
                    ]
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    spacing: "sm",
                    contents: [
                      {
                        type: "text",
                        text: "Room",
                        color: "#aaaaaa",
                        size: "sm",
                        flex: 2
                      },
                      {
                        type: "text",
                        text: roomNumber || "Unknown",
                        wrap: true,
                        size: "sm",
                        flex: 4
                      }
                    ]
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    spacing: "sm",
                    contents: [
                      {
                        type: "text",
                        text: "Status",
                        color: "#aaaaaa",
                        size: "sm",
                        flex: 2
                      },
                      {
                        type: "text",
                        text: status || "Updated",
                        wrap: true,
                        size: "sm",
                        color: status === "Completed" ? "#4CAF50" : status === "In Progress" ? "#FF9800" : status === "Cancelled" ? "#F44336" : "#2196F3",
                        flex: 4,
                        weight: "bold"
                      }
                    ]
                  }
                ]
              },
              {
                type: "box",
                layout: "vertical",
                margin: "lg",
                contents: [
                  {
                    type: "text",
                    text: comment || `Status has been updated to ${status || "a new status"}`,
                    size: "sm",
                    wrap: true
                  }
                ]
              }
            ]
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: formattedDate,
                size: "xs",
                color: "#aaaaaa",
                align: "center"
              }
            ]
          }
        }
      }]
    };

    console.log("Sending Line message:", JSON.stringify(message, null, 2));
    const result = await sendLineMessage(channelAccessToken, message);
    console.log("Line notification sent successfully:", result);
  } catch (error) {
    console.error("Error sending Line notification:", error);
    throw error;
  }
}
