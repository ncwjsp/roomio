import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/authOptions";
import { redirect } from "next/navigation";

export default function Home() {
  const session = getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex align-middle justify-center">
      <div>
        <div>
          <Link href="/login">Sign In Now</Link>
        </div>
        <div>
          <Link href="/dashboard">Go to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
