import { Client } from "@line/bot-sdk";
import User from "@/app/models/User";
import dbConnect from "@/lib/mongodb";

export async function getLineClient(userId) {
  await dbConnect();
  const user = await User.findById(userId);

  if (
    !user?.lineConfig?.channelAccessToken ||
    !user?.lineConfig?.channelSecret
  ) {
    throw new Error("LINE configuration not found");
  }

  return new Client({
    channelAccessToken: user.lineConfig.channelAccessToken,
    channelSecret: user.lineConfig.channelSecret,
  });
}

/**
 * Send a message to a LINE user or group
 * @param {string} channelAccessToken - The LINE channel access token
 * @param {object} message - The message object to send
 * @returns {Promise<object>} - The LINE API response
 */
export async function sendLineMessage(channelAccessToken, message) {
  try {
    const client = new Client({
      channelAccessToken: channelAccessToken
    });
    
    // If it's a simple text message
    if (typeof message === 'string') {
      return await client.pushMessage(message.to, {
        type: 'text',
        text: message
      });
    }
    
    // If it's a complex message object
    return await client.pushMessage(message.to, message.messages);
  } catch (error) {
    console.error('Error sending LINE message:', error);
    throw error;
  }
}
