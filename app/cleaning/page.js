"use client";

import { useState, useEffect } from "react";

const Cleaning = () => {
  const [cleaningRequests, setCleaningRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({
    roomNumber: "",
    building: "",
    floor: "",
    name: "",
    date: "",
    status: "waiting",
    assignedTo: "Not Assigned",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState(null);

  // Fetch cleaning requests from the API
  const fetchCleaningRequests = async () => {
    try {
      const res = await fetch("/api/cleaning");
      if (!res.ok) throw new Error("Failed to fetch cleaning requests");
      const data = await res.json();
      setCleaningRequests(data);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    fetchCleaningRequests();
  }, []);

  // Add a new cleaning request
  const handleAddRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cleaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      if (!res.ok) throw new Error("Failed to add cleaning request");
      fetchCleaningRequests();
      setNewRequest({
        roomNumber: "",
        building: "",
        floor: "",
        name: "",
        date: "",
        status: "waiting",
        assignedTo: "Not Assigned",
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  // Edit a cleaning request
  const handleEditRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cleaning", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingRequestId, updates: newRequest }),
      });
      if (!res.ok) throw new Error("Failed to update cleaning request");
      fetchCleaningRequests();
      setIsEditing(false);
      setEditingRequestId(null);
      setNewRequest({
        roomNumber: "",
        building: "",
        floor: "",
        name: "",
        date: "",
        status: "waiting",
        assignedTo: "Not Assigned",
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  // Delete cleaning requests
  const handleDeleteRequests = async (id) => {
    try {
      const res = await fetch("/api/cleaning", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) throw new Error("Failed to delete cleaning request");
      fetchCleaningRequests();
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Cleaning Page</h1>

        {/* Form Section */}
        <form onSubmit={isEditing ? handleEditRequest : handleAddRequest} className="mb-8">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Room Number"
              value={newRequest.roomNumber}
              onChange={(e) => setNewRequest({ ...newRequest, roomNumber: e.target.value })}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Building"
              value={newRequest.building}
              onChange={(e) => setNewRequest({ ...newRequest, building: e.target.value })}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Floor"
              value={newRequest.floor}
              onChange={(e) => setNewRequest({ ...newRequest, floor: e.target.value })}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Name"
              value={newRequest.name}
              onChange={(e) => setNewRequest({ ...newRequest, name: e.target.value })}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Date (DD/MM/YYYY)"
              value={newRequest.date}
              onChange={(e) => setNewRequest({ ...newRequest, date: e.target.value })}
              className="p-2 border rounded"
            />
          </div>
          <div className="flex space-x-4">
            <button type="submit" className="p-2 bg-blue-500 text-white rounded">
              {isEditing ? "Save Changes" : "Add Request"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingRequestId(null);
                }}
                className="p-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Cleaning Requests Table */}
        <div className="overflow-x-auto bg-white p-4 rounded-[10px] shadow">
          <table className="table-auto w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 px-4">Room No.</th>
                <th className="py-2 px-4">Building</th>
                <th className="py-2 px-4">Firstname-Lastname</th>
                <th className="py-2 px-4">DD/MM/YY</th>
                <th className="py-2 px-4">Cleaning Status</th>
                <th className="py-2 px-4">Assigned To</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cleaningRequests.map((request) => (
                <tr key={request._id} className="border-b">
                  <td className="py-2 px-4">{request.roomNumber}</td>
                  <td className="py-2 px-4">{request.building}</td>
                  <td className="py-2 px-4">{request.name}</td>
                  <td className="py-2 px-4">{request.date}</td>
                  <td
                    className={`py-2 px-4 ${
                      request.status === "successful"
                        ? "text-green-500"
                        : request.status === "waiting"
                        ? "text-red-500"
                        : "text-orange-500"
                    }`}
                  >
                    • {request.status}
                  </td>
                  <td className="py-2 px-4">{request.assignedTo}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => {
                        setNewRequest(request);
                        setIsEditing(true);
                        setEditingRequestId(request._id);
                      }}
                      className="p-1 bg-yellow-500 text-white rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRequests(request._id)}
                      className="p-1 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Cleaning;
