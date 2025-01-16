"use client";

import { useState, useEffect } from "react";

const Cleaning = () => {
  const buildings = ["A", "B", "C"];
  const floors = Array.from({ length: 8 }, (_, i) => `${i + 1}th`);

  const generateCleaningRequests = () => {
    const statuses = ["waiting", "successful", "in process"];
    const cleaners = ["Not Assigned", "Cleaner A", "Cleaner B", "Cleaner C"];
    const requests = [];

    buildings.forEach((building) => {
      for (let floor = 1; floor <= 8; floor++) {
        for (let room = 1; room <= 10; room++) {
          const roomNumber = `${building}${floor}0${room}`; // A101, A102, ... A110
          requests.push({
            roomNumber,
            building,
            floor: `${floor}th`,
            name: "Landon James",
            date: `${(Math.floor(Math.random() * 28) + 1)
              .toString()
              .padStart(2, "0")}/${(Math.floor(Math.random() * 12) + 1)
              .toString()
              .padStart(2, "0")}/2022`, // Random DD/MM/YYYY
            status: statuses[Math.floor(Math.random() * statuses.length)],
            assignedTo: cleaners[Math.floor(Math.random() * cleaners.length)],
          });
        }
      }
    });
    return requests;
  };

  const [cleaningRequests, setCleaningRequests] = useState([]);
  const [filteredBuilding, setFilteredBuilding] = useState("");
  const [filteredFloor, setFilteredFloor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setCleaningRequests(generateCleaningRequests());
  }, []);

  const filteredRequests = cleaningRequests.filter((request) => {
    const matchesBuilding = filteredBuilding
      ? request.building === filteredBuilding
      : true;
    const matchesFloor = filteredFloor
      ? request.roomNumber.includes(`${filteredBuilding}${filteredFloor}`)
      : true;
    const matchesSearch = searchQuery
      ? request.roomNumber.includes(searchQuery.toUpperCase())
      : true;
    return matchesBuilding && matchesFloor && matchesSearch;
  });

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Cleaning Page</h1>

        {/* Filters Section */}
        <div className="bg-[#898F63] p-6 rounded-[10px] mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <select
              className="px-4 py-2 bg-white rounded-[10px] border border-gray-300"
              value={filteredBuilding}
              onChange={(e) => setFilteredBuilding(e.target.value)}
            >
              <option value="">Select Building</option>
              {buildings.map((building) => (
                <option key={building} value={building}>
                  Building {building}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 bg-white rounded-[10px] border border-gray-300"
              value={filteredFloor}
              onChange={(e) => setFilteredFloor(e.target.value)}
              disabled={!filteredBuilding}
            >
              <option value="">Select Floor</option>
              {floors.map((floor, index) => (
                <option key={index} value={index + 1}>
                  {floor} Floor
                </option>
              ))}
            </select>
            <div className="flex items-center bg-white border border-gray-300 rounded-[10px] p-2">
              <input
                type="text"
                placeholder="Search Rooms"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                className="flex-grow px-2 text-sm text-gray-500 focus:outline-none"
              />
              <i className="bi bi-search text-gray-500"></i>
            </div>
          </div>

          <h2 className="text-white text-lg font-bold">Cleaning Request</h2>
        </div>

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
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request, index) => (
                <tr key={index} className="border-b">
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
