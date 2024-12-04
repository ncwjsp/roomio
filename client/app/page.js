import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-center">
      <Link href="/login">Sign In Now</Link>
    </div>
  );
}
