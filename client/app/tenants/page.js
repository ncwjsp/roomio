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
  const [selectedTenant, setSelectedTenant] = useState(null);

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

  const handleTenantClick = (tenant) => {
    setSelectedTenant(tenant);
  };

  const handleEdit = () => {
    // Implement edit functionality here
    console.log(`Editing tenant with id: ${selectedTenant.id}`);
    // Redirect to the edit page or show edit form
  };

  const handleDelete = () => {
    // Implement delete functionality here
    console.log(`Deleting tenant with id: ${selectedTenant.id}`);
    // Remove tenant from the list
    setTenants(tenants.filter((tenant) => tenant.id !== selectedTenant.id));
    setFilteredTenants(filteredTenants.filter((tenant) => tenant.id !== selectedTenant.id));
    setSelectedTenant(null);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      <div className="container px-4 py-8">
        {selectedTenant ? (
          <div className="p-6 rounded-lg bg-white text-gray-800 border border-gray-200 shadow-lg">
            <h1 className="text-3xl font-semibold mb-4">{selectedTenant.name}</h1>
            <p className="mb-2"><strong>Room:</strong> {selectedTenant.room}</p>
            <p className="mb-2"><strong>Line ID:</strong> {selectedTenant.lineId}</p>
            <p className="mb-2"><strong>Tel:</strong> {selectedTenant.tel}</p>
            {/* Add more tenant details as needed */}
            <div className="mt-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
                onClick={handleEdit}
              >
                Edit
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleDelete}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded ml-2 hover:bg-gray-600"
                onClick={() => setSelectedTenant(null)}
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-6">
              <h1 className="text-3xl font-semibold">Tenant Management</h1>
              <Link
                className="text-white font-semibold p-2 rounded-xl bg-black hover:bg-white hover:text-black border border-black"
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
                  className="p-4 rounded-lg bg-white text-gray-800 border border-gray-200 shadow-lg cursor-pointer hover:shadow-xl"
                  onClick={() => handleTenantClick(tenant)}
                >
                  <h5 className="text-xl font-semibold">{tenant.name}</h5>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Tenants;
