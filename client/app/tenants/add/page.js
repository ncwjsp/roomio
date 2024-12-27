"use client";

// pages/tenant/add.js
import { useState, useEffect } from "react";

const AddTenant = () => {
  // State variables
  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [tenantData, setTenantData] = useState({
    name: "",
    email: "",
    phone: "",
    lineId: "",
    pfp: "",
    room: "",
    leaseStartDate: "",
    leaseEndDate: "",
    depositAmount: "",
  });
  const [friendName, setFriendName] = useState("");
  const [friendDate, setFriendDate] = useState("");
  const [usersList, setUsersList] = useState([]); // List of available users for userId

  // Fetch the list of available users (this could come from your user database)
  useEffect(() => {
    const fetchLineFriends = async () => {
      try {
        const response = await fetch("/api/friend"); // Endpoint to fetch users
        const data = await response.json();
        setUsersList(data.friends);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchLineFriends();
  }, []);

  const handleSelectUser = (userId) => {
    const selectedUser = usersList.find((user) => user.userId === userId);
    if (selectedUser) {
      setFriendName(selectedUser.name);
      const dateString = new Date(selectedUser.createdAt).toLocaleString(
        "en-US",
        {
          timeZone: "Asia/Bangkok",
          hourCycle: "h23",
        }
      );
      setFriendDate(dateString);

      setSelectedUserId(userId);
      setTenantData((prevData) => ({
        ...prevData,
        pfp: selectedUser.pfp, // Set the profile picture in tenant data
      }));
    }
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTenantData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tenantData),
      });

      if (!response.ok) {
        throw new Error("Failed to add tenant");
      }

      const data = await response.json();
      console.log("Tenant added:", data);
    } catch (error) {
      console.error("Error adding tenant:", error);
    }
  };

  return (
    <div className="mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Tenant</h1>
      <form onSubmit={handleSubmit}>
        <div className="flex">
          <div>
            <div className="mb-4">
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700"
              >
                Selected User
              </label>
              {selectedUserId ? (
                <div className="flex items-center mt-2">
                  {/* Profile Picture */}
                  <img
                    src={tenantData.pfp}
                    alt={`${tenantData.name}'s Profile`}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  {/* Name and ID */}
                  <div>
                    <p className="font-medium">{friendName}</p>
                    <p className="text-gray-500 text-sm">
                      Added on {friendDate}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-2">
                  No user selected. Please select a user below.
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-4 py-2 mt-4 bg-blue-600 text-white rounded-md"
              >
                Select User
              </button>
            </div>

            {/* Tenant Information */}
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={tenantData.name}
                onChange={handleChange}
                placeholder="Enter tenant's name"
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={tenantData.email}
                onChange={handleChange}
                placeholder="Enter tenant's email"
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={tenantData.phone}
                onChange={handleChange}
                placeholder="Enter tenant's phone number"
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="lineId"
                className="block text-sm font-medium text-gray-700"
              >
                LINE ID
              </label>
              <input
                type="text"
                id="lineId"
                name="lineId"
                value={tenantData.lineId}
                onChange={handleChange}
                placeholder="Enter tenant's LINE ID"
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="leaseStartDate"
                className="block text-sm font-medium text-gray-700"
              >
                Lease Start Date
              </label>
              <input
                type="date"
                id="leaseStartDate"
                name="leaseStartDate"
                value={tenantData.leaseStartDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="leaseEndDate"
                className="block text-sm font-medium text-gray-700"
              >
                Lease End Date
              </label>
              <input
                type="date"
                id="leaseEndDate"
                name="leaseEndDate"
                value={tenantData.leaseEndDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="depositAmount"
                className="block text-sm font-medium text-gray-700"
              >
                Deposit Amount
              </label>
              <input
                type="number"
                id="depositAmount"
                name="depositAmount"
                value={tenantData.depositAmount}
                onChange={handleChange}
                placeholder="Enter deposit amount"
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-4">
              <label
                htmlFor="propertyId"
                className="block text-sm font-medium text-gray-700"
              >
                Room
              </label>
              <select
                id="propertyId"
                name="propertyId"
                value={tenantData.propertyId}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
                required
              >
                <option value="">Select Room</option>
                {/* Replace with dynamic property options */}
                <option value="1">Property 1</option>
                <option value="2">Property 2</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md mt-4"
        >
          Add Tenant
        </button>
      </form>

      {/* Modal for selecting user */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md w-200">
            <h2 className="text-xl font-bold mb-4">Select User</h2>
            <ul className="space-y-4">
              {usersList.map((user) => (
                <li
                  key={user.userId}
                  className="flex items-center space-x-4 border-b pb-2"
                >
                  {/* Profile Picture */}
                  <img
                    src={user.pfp}
                    alt={`${user.name}'s Profile`}
                    className="w-10 h-10 rounded-full"
                  />
                  {/* Name and ID */}
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-gray-500 text-sm">{user.userId}</p>
                  </div>
                  {/* Select Button */}
                  <button
                    onClick={() => handleSelectUser(user.userId)}
                    className="text-blue-600 hover:underline ml-auto p-3"
                  >
                    Select
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTenant;
