import Link from "next/link";

export default function Home() {
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
