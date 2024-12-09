"use client"; // To use client-side hooks like usePathname

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Define routes where the Navbar should not appear
  const hideNavbarRoutes = ["/", "/login", "/register"];

  // Check if the current path is in the "hideNavbarRoutes" list
  if (hideNavbarRoutes.includes(pathname)) {
    return null; // Do not render Navbar
  }

  return (
    <div className="bg-gray-100 h-screen flex flex-col justify-between w-60 fixed">
      <div>
        {/* Brand Section */}
        <div className="p-6 text-3xl font-bold text-center">
          <span>Room</span>io
        </div>

        {/* Navigation Links */}
        <nav className="mt-6">
          <ul>
            <li className="mb-2">
              <Link
                href="/dashboard"
                className="flex justify-center items-center px-6 py-3 text-gray-700 hover:bg-gray-200"
              >
                Dashboard
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/tenants"
                className="flex justify-center items-center px-6 py-3 text-gray-700 hover:bg-gray-200"
              >
                Tenants
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/utility-usage"
                className="flex justify-center items-center px-6 py-3 text-gray-700 hover:bg-gray-200"
              >
                Utility Usage
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/billing"
                className="flex justify-center items-center px-6 py-3 text-gray-700 hover:bg-gray-200"
              >
                Billing
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/cleaning"
                className="flex justify-center items-center px-6 py-3 text-gray-700 hover:bg-gray-200"
              >
                Cleaning
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/maintenance"
                className="flex justify-center items-center px-6 py-3 text-gray-700 hover:bg-gray-200"
              >
                Maintenance
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/staffs"
                className="flex justify-center items-center px-6 py-3 text-gray-700 hover:bg-gray-200"
              >
                Staffs
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/parcels"
                className="flex justify-center items-center px-6 py-3 text-gray-700 hover:bg-gray-200"
              >
                Parcels
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/inventory"
                className="flex justify-center items-center px-6 py-3 text-gray-700 hover:bg-gray-200"
              >
                Inventory
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Logout Section */}
      <div className="mb-4">
        <Link
          href="/setting"
          className="flex justify-center items-center px-6 py-3 text-gray-700 hover:bg-gray-200"
        >
          Setting
        </Link>
        <button className="w-full py-3 text-gray-70 bg-gray-100 hover:bg-gray-300 rounded">
          Logout
        </button>
      </div>
    </div>
  );
}
