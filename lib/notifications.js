import { format } from "date-fns";
import { getLineClient } from "./line";

export async function sendMaintenanceNotification({
  userId,
  maintenance,
  status,
  comment,
}) {
  if (!maintenance.room?.tenant?.lineUserId) {
    console.log("No Line notification sent - missing tenant lineUserId:", {
      tenantId: maintenance.room?.tenant?._id,
      lineUserId: maintenance.room?.tenant?.lineUserId,
    });
    return;
  }

  try {
    const client = await getLineClient(userId);
    const buildingName = maintenance.room.floor.building.name;
    const roomNumber = maintenance.room.roomNumber;
    const formattedDate = format(new Date(), "MMMM d, yyyy 'at' h:mm a");

    console.log("Sending Line notification to:", maintenance.room.tenant.lineUserId);
    console.log("Using Line client with user:", userId);

    const message = {
      type: "flex",
      altText: `Maintenance Status Update for Room ${roomNumber}`,
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
              text: maintenance.problem,
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
                      text: buildingName,
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
                      text: `${roomNumber}`,
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
                      text: status,
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
                  text: comment || `Status has been updated to ${status}`,
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
    };

    console.log("Sending Line message:", JSON.stringify(message, null, 2));
    const result = await client.pushMessage(maintenance.room.tenant.lineUserId, message);
    console.log("Line notification sent successfully:", result);
  } catch (error) {
    console.error("Error sending Line notification:", error);
    console.error("Error details:", error.response?.data || error.message);
    // Continue with the response even if Line notification fails
  }
}
