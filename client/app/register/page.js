import Register from "@/app/ui/register";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { redirect } from "next/dist/server/api-utils";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return <Register />;
}
