"use client"; // To use client-side hooks like usePathname

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [expandedSection, setExpandedSection] = useState("core"); // Default to core expanded

  // Define routes where the Navbar should not appear
  const hideNavbarRoutes = [
    "/",
    "/login",
    "/register",
    "/line/cleaning",
    "/line/maintenance",
    "/line/maintenance/request",
    "/line/maintenance/[id]",
    "/line/parcels",
    "/line/payment",
    "/line/tenantinfo",
    "/line/report",
    "/line/schedule",
    "/line/tasks",
    "/line/announcement",
  ];

  // Check if the current path is in the "hideNavbarRoutes" list
  if (hideNavbarRoutes.includes(pathname)) {
    return null; // Do not render Navbar
  }

  // Helper function to check if the link is active
  const isActive = (route) => pathname === route;

  const navSections = {
    core: {
      title: "Management",
      links: [
        { name: "Dashboard", route: "/dashboard" },
        { name: "Buildings", route: "/buildings" },
        { name: "Tenants", route: "/tenants" },
        { name: "Billings", route: "/billings" },
        { name: "Staffs", route: "/staffs" },
      ],
    },
    services: {
      title: "Services",
      links: [
        { name: "Cleaning", route: "/cleaning" },
        { name: "Maintenance", route: "/maintenance" },
        { name: "Parcels", route: "/parcels" },
        { name: "Announcement", route: "/announcement" },
      ],
    },
  };

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
            {Object.entries(navSections).map(([key, section]) => (
              <div key={key} className="mb-2">
                <button
                  onClick={() =>
                    setExpandedSection(expandedSection === key ? null : key)
                  }
                  className="w-full px-6 py-2 text-left text-white hover:bg-gray-50 hover:text-black flex justify-between items-center border-t border-gray-100 transition-colors duration-200"
                >
                  {section.title}
                  <span
                    className={`text-sm text-gray-400 transform transition-transform duration-200 ${
                      expandedSection === key ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    expandedSection === key
                      ? "max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  {section.links.map((link) => (
                    <Link
                      key={link.route}
                      href={link.route}
                      className={`flex justify-center items-center px-6 py-3 mb-1 rounded no-underline transition-all duration-200 ${
                        isActive(link.route)
                          ? "bg-[#B3B7A0] text-white"
                          : "text-black hover:bg-gray-200"
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Settings and Logout */}
        <div className="mb-4 pt-2 border-t border-gray-100">
          <Link
            href="/setting"
            className={`flex justify-center items-center px-6 py-3 rounded no-underline transition-all duration-200 ${
              isActive("/setting")
                ? "bg-[#B3B7A0] text-white"
                : "text-black hover:bg-gray-200"
            }`}
          >
            Setting
          </Link>
          <button
            className="w-full py-3 text-black bg-white hover:bg-gray-300 rounded transition-colors duration-200"
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