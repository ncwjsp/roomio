"use client"; // To use client-side hooks like usePathname

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Router from "next/router";

export default function Navbar() {
  const pathname = usePathname();

  // Define routes where the Navbar should not appear
  const hideNavbarRoutes = [
    "/",
    "/login",
    "/register",
    "/line/cleaning",
    "/line/maintenance",
    "/line/parcels",
    "/line/payment",
    "/line/report",
    "/line/security",
    "/line/housekeeper/schedule",
    "/line/housekeeper/task",
    "/line/technician/schedule",
    "/line/technician/task",
  ];

  // Check if the current path is in the "hideNavbarRoutes" list
  if (hideNavbarRoutes.includes(pathname)) {
    return null; // Do not render Navbar
  }

  // Helper function to check if the link is active
  const isActive = (route) => pathname === route;

  return (
    <>
      <div className="bg-white h-screen flex flex-col justify-between w-60 fixed shadow">
        <div>
          {/* Brand Section */}
          <div className="p-6 text-3xl font-bold text-center text-black">
            <span className="text-[#889F63]">Room</span>io
          </div>

          {/* Navigation Links */}
          <nav className="mt-6">
            <ul className="list-none p-0 m-0">
              {[
                { name: "Dashboard", route: "/dashboard" },
                { name: "Units", route: "/units" },
                { name: "Tenants", route: "/tenants" },
                { name: "Utility Usage", route: "/utility-usage" },
                // { name: "Billing", route: "/billing" },
                { name: "Cleaning", route: "/cleaning" },
                { name: "Maintenance", route: "/maintenance" },
                { name: "Staffs", route: "/staffs" },
                { name: "Parcels", route: "/parcels" },
              ].map((link) => (
                <li className="mb-2" key={link.route}>
                  <Link
                    href={link.route}
                    className={`flex justify-center items-center px-6 py-3 rounded no-underline ${
                      isActive(link.route)
                        ? "bg-[#889F63] text-white"
                        : "text-black hover:bg-gray-200"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Logout Section */}
        <div className="mb-4">
          <Link
            href="/setting"
            className={`flex justify-center items-center px-6 py-3 rounded no-underline ${
              isActive("/setting")
                ? "bg-[#889F63] text-white"
                : "text-black hover:bg-gray-200"
            }`}
          >
            Setting
          </Link>
          <button
            className="w-full py-3 text-black bg-white hover:bg-gray-300 rounded"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="ml-60"></div>
    </>
  );
}
