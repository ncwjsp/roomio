"use client";

import { useState } from "react";

const Utility = () => {
  const buildings = ["A", "B", "C"];
  const filters = ["Completed", "Overdue", "Waiting"];

  const generateUtilities = () => {
    let utilities = [];
    buildings.forEach((building) => {
      for (let floor = 1; floor <= 8; floor++) {
        for (let room = 1; room <= 10; room++) {
          const number = `${building}${floor}${room.toString().padStart(2, "0")}`; // Correct room numbering
          const electricityUsage = Math.floor(Math.random() * 100); // Random usage
          const waterUsage = Math.floor(Math.random() * 100); // Random usage
          const electricityRate = 10; // Per unit cost
          const waterRate = 10; // Per unit cost
          const totalCost =
            electricityUsage * electricityRate +
            waterUsage * waterRate +
            500; // Adding fixed room rental
          const paymentStatus =
            Math.random() > 0.7
              ? "Overdue"
              : Math.random() > 0.5
              ? "Waiting"
              : "Completed";
          utilities.push({
            building,
            number,
            electricityUsage,
            waterUsage,
            electricityRate,
            waterRate,
            totalCost,
            paymentStatus,
            details: {
              water: paymentStatus === "Completed" ? "Paid" : "Unpaid",
              electricity: paymentStatus === "Completed" ? "Paid" : "Unpaid",
              roomRental: "Paid",
              cleaning: Math.random() > 0.5 ? "Paid" : "Unpaid",
              maintenance: Math.random() > 0.5 ? "Paid" : "Unpaid",
              receipt: "/images/receipt.jpg", // Example receipt image
            },
          });
        }
      }
    });
    return utilities;
  };

  const [utilityData, setUtilityData] = useState(generateUtilities());
  const [filteredBuilding, setFilteredBuilding] = useState("");
  const [filteredStatus, setFilteredStatus] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);

  const filteredUtilities = utilityData.filter((utility) => {
    const matchesBuilding = filteredBuilding
      ? utility.building === filteredBuilding
      : true;
    const matchesStatus = filteredStatus
      ? utility.paymentStatus === filteredStatus
      : true;
    return matchesBuilding && matchesStatus;
  });

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Utility Usage</h1>

        {/* Filters Section */}
        <div className="bg-[#898F63] p-6 rounded-[10px] mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <select
              className="px-4 py-2 bg-white rounded-[10px] border border-gray-300"
              value={filteredBuilding}
              onChange={(e) => setFilteredBuilding(e.target.value)}
            >
              <option value="">All Rooms</option>
              {buildings.map((building) => (
                <option key={building} value={building}>
                  Building {building}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 bg-white rounded-[10px] border border-gray-300"
              value={filteredStatus}
              onChange={(e) => setFilteredStatus(e.target.value)}
            >
              <option value="">Filter</option>
              {filters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-[#898F63] text-white">
              <tr>
                <th className="p-4">Building</th>
                <th className="p-4">Room No.</th>
                <th className="p-4">
                  <i className="bi bi-lightning-charge-fill text-[#FFA600]"></i>{" "}
                  Electricity Usage
                </th>
                <th className="p-4">
                  <i className="bi bi-droplet-half text-[#0775FF]"></i> Water
                  Usage
                </th>
                <th className="p-4">Total Cost</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUtilities.map((utility, index) => (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } text-gray-700`}
                >
                  <td className="p-4 text-center">{utility.building}</td>
                  <td className="p-4 text-center">{utility.number}</td>
                  <td className="p-4 text-center">
                    {utility.electricityUsage}
                  </td>
                  <td className="p-4 text-center">{utility.waterUsage}</td>
                  <td className="p-4 text-center">{utility.totalCost} THB</td>
                  <td
                    className={`p-4 text-center font-semibold ${
                      utility.paymentStatus === "Completed"
                        ? "text-[#009231]"
                        : utility.paymentStatus === "Waiting"
                        ? "text-[#FFA600]"
                        : "text-[#F30505]"
                    }`}
                  >
                    {utility.paymentStatus}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded"
                      onClick={() => setSelectedRoom(utility)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details Modal */}
        {selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
              <h2 className="text-lg font-bold mb-4">
                Room {selectedRoom.number} Details
              </h2>
              <p>
                <strong>Electricity:</strong>{" "}
                <span
                  className={
                    selectedRoom.details.electricity === "Paid"
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {selectedRoom.details.electricity}
                </span>
              </p>
              <p>
                <strong>Water:</strong>{" "}
                <span
                  className={
                    selectedRoom.details.water === "Paid"
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {selectedRoom.details.water}
                </span>
              </p>
              <p>
                <strong>Room Rental:</strong>{" "}
                <span className="text-green-500">
                  {selectedRoom.details.roomRental}
                </span>
              </p>
              <p>
                <strong>Cleaning Service:</strong>{" "}
                <span
                  className={
                    selectedRoom.details.cleaning === "Paid"
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {selectedRoom.details.cleaning}
                </span>
              </p>
              <p>
                <strong>Maintenance Service:</strong>{" "}
                <span
                  className={
                    selectedRoom.details.maintenance === "Paid"
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {selectedRoom.details.maintenance}
                </span>
              </p>
              <div className="mt-4">
                <strong>Receipt:</strong>
                <img
                  src={selectedRoom.details.receipt}
                  alt="Receipt"
                  className="mt-2 w-full rounded"
                />
              </div>
              <button
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
                onClick={() => setSelectedRoom(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Utility;
