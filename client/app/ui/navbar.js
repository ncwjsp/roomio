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

  // Helper function to check if the link is active
  const isActive = (route) => pathname === route;

  return (
    <div className="bg-white h-screen flex flex-col justify-between w-60 fixed shadow">
      <div>
        {/* Brand Section */}
        <div className="p-6 text-3xl font-bold text-center text-black">
          <span className="text-[#889F63]">Room</span>io
        </div>

        {/* Navigation Links */}
        <nav className="mt-6">
          <ul>
            {[
              { name: "Dashboard", route: "/dashboard" },
              { name: "Tenants", route: "/tenants" },
              { name: "Utility Usage", route: "/utility-usage" },
              { name: "Billing", route: "/billing" },
              { name: "Cleaning", route: "/cleaning" },
              { name: "Maintenance", route: "/maintenance" },
              { name: "Staffs", route: "/staffs" },
              { name: "Parcels", route: "/parcels" },
              { name: "Inventory", route: "/inventory" },
            ].map((link) => (
              <li className="mb-2" key={link.route}>
                <Link
                  href={link.route}
                  className={`flex justify-center items-center px-6 py-3 rounded ${
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
          className={`flex justify-center items-center px-6 py-3 rounded ${
            isActive("/setting")
              ? "bg-[#889F63] text-white"
              : "text-black hover:bg-gray-200"
          }`}
        >
          Setting
        </Link>
        <button className="w-full py-3 text-black bg-white hover:bg-gray-300 rounded">
          Logout
        </button>
      </div>
    </div>
  );
}
