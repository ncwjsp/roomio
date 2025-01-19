"use client";

import { useState, useEffect } from "react";

const Cleaning = () => {
  const buildings = ["A", "B", "C"];
  const floors = Array.from({ length: 8 }, (_, i) => `${i + 1}th`);
  const timeSlots = [
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "01:00 PM - 02:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
  ];

  const [cleaningRequests, setCleaningRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({
    roomNumber: "",
    building: "",
    floor: "",
    name: "",
    date: "",
    status: "waiting",
    assignedTo: "Not Assigned",
    timeSlot: "",
  });

  useEffect(() => {
    fetchCleaningRequests();
  }, []);

  const fetchCleaningRequests = async () => {
    try {
      const res = await fetch("/api/cleaning");
      const data = await res.json();
      setCleaningRequests(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cleaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      if (!res.ok) throw new Error("Failed to add cleaning request");
      await fetchCleaningRequests(); // Refresh data after adding
      setNewRequest({
        roomNumber: "",
        building: "",
        floor: "",
        name: "",
        date: "",
        status: "waiting",
        assignedTo: "Not Assigned",
        timeSlot: "",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      const res = await fetch("/api/cleaning", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) throw new Error("Failed to delete cleaning request");
      await fetchCleaningRequests();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Cleaning Page</h1>

        {/* Add Request Form */}
        <form onSubmit={handleAddRequest} className="bg-white p-4 rounded mb-8 shadow">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Room Number"
              value={newRequest.roomNumber}
              onChange={(e) => setNewRequest({ ...newRequest, roomNumber: e.target.value })}
              className="p-2 border rounded"
            />
            <select
              value={newRequest.building}
              onChange={(e) => setNewRequest({ ...newRequest, building: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="">Select Building</option>
              {buildings.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
            <select
              value={newRequest.floor}
              onChange={(e) => setNewRequest({ ...newRequest, floor: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="">Select Floor</option>
              {floors.map((floor, index) => (
                <option key={index} value={floor}>
                  {floor}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Name"
              value={newRequest.name}
              onChange={(e) => setNewRequest({ ...newRequest, name: e.target.value })}
              className="p-2 border rounded"
            />
            <input
              type="date"
              value={newRequest.date}
              onChange={(e) => setNewRequest({ ...newRequest, date: e.target.value })}
              className="p-2 border rounded"
            />
            <select
              value={newRequest.timeSlot}
              onChange={(e) => setNewRequest({ ...newRequest, timeSlot: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="">Select Time Slot</option>
              {timeSlots.map((slot, index) => (
                <option key={index} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="p-2 bg-blue-500 text-white rounded">
            Add Request
          </button>
        </form>

        {/* Cleaning Requests Table */}
        <div className="overflow-x-auto bg-white p-4 rounded shadow">
          <table className="table-auto w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 px-4">Room No.</th>
                <th className="py-2 px-4">Building</th>
                <th className="py-2 px-4">Floor</th>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Time Slot</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cleaningRequests.map((request) => (
                <tr key={request._id} className="border-b">
                  <td className="py-2 px-4">{request.roomNumber}</td>
                  <td className="py-2 px-4">{request.building}</td>
                  <td className="py-2 px-4">{request.floor}</td>
                  <td className="py-2 px-4">{request.name}</td>
                  <td className="py-2 px-4">{request.date}</td>
                  <td className="py-2 px-4">{request.timeSlot}</td>
                  <td
                    className={`py-2 px-4 ${
                      request.status === "successful"
                        ? "text-green-500"
                        : request.status === "waiting"
                        ? "text-red-500"
                        : "text-orange-500"
                    }`}
                  >
                    {request.status}
                  </td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleDeleteRequest(request._id)}
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
