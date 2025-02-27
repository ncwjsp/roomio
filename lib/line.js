import { Client } from "@line/bot-sdk";
import User from "@/app/models/User";
import dbConnect from "@/lib/mongodb";

export async function getLineClient(channelAccessToken) {
  return new Client({
    channelAccessToken: channelAccessToken
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
    console.log("Sending LINE message to:", message.to);
    
    // Validate the channel access token
    if (!channelAccessToken) {
      throw new Error("Missing LINE channel access token");
    }

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
    try {
      const result = await client.pushMessage(message.to, message.messages[0]);
      console.log("LINE message sent successfully");
      return result;
    } catch (apiError) {
      // Extract and log the detailed error from LINE API
      if (apiError.originalError?.response?.data) {
        console.log(apiError)
        
        // Throw a more specific error with the LINE API message
        if (apiError.originalError?.response?.data?.message) {
          throw new Error(`LINE API error: ${apiError.originalError?.response?.data?.message}`);
        }
      }
      throw apiError;
    }
  } catch (error) {
    console.log('Error sending LINE message:', error.message);
    throw error;
  }
}
