import { Client } from "@line/bot-sdk";
import User from "@/app/models/User";

export async function getLineClient(userId) {
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
