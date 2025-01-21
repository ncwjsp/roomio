import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";

export async function getSession() {
  const session = await getServerSession(authOptions);
  return session;
}
