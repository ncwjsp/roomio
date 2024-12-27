"use client";

import { useState, useEffect } from "react";
import tenantsData from "./tenantsData"; // Import the sample data
import Link from "next/link";

const Tenants = () => {
  const TENANTS_PER_PAGE = 12;

  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Set the tenants to the imported sample data
    setTenants(tenantsData);
    setFilteredTenants(tenantsData); // Initially showing all tenants
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = tenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(query.toLowerCase()) ||
        tenant.room.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTenants(filtered);
    setCurrentPage(1); // Reset to page 1 when search changes
  };

  const totalPages = Math.ceil(filteredTenants.length / TENANTS_PER_PAGE);
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * TENANTS_PER_PAGE,
    currentPage * TENANTS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="container px-4 py-8">
        <div className="flex justify-between">
          <h1 className="text-3xl font-semibold mb-6">Tenant Management</h1>
          <Link
            className="text-white font-semibold p-2 rounded-xl mb-2 bg-black hover:bg-white hover:text-black"
            href="/tenants/add"
          >
            Add a New Tenant
          </Link>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Search by Tenant Name or Room"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Tenant List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="p-4 rounded-lg bg-white text-gray-800 border border-gray-200"
            >
              <Link href={`/preview/${tenant.id}`}>
                <h5 className="text-xl font-semibold cursor-pointer">{tenant.name}</h5>
              </Link>
              <p className="text-sm">Room: {tenant.room}</p>
              <p className="text-sm">Line ID: {tenant.lineId}</p>
              <p className="text-sm">Tel: {tenant.tel}</p>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            <button
              className="px-4 py-2 rounded border disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`px-4 py-2 rounded ${
                  currentPage === idx + 1
                    ? "bg-blue-500 text-white"
                    : "border hover:bg-gray-100"
                }`}
                onClick={() => handlePageChange(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="px-4 py-2 rounded border disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tenants;
