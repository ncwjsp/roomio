"use client";

import { useState } from "react";

const Utility = () => {
  const buildings = ["A", "B", "C"];
  const filters = ["Completed", "Overdue", "Waiting"];
  const generateUtilities = () => {
    let utilities = [];
    buildings.forEach((building) => {
      for (let floor = 1; floor <= 8; floor++) {
        for (let room = 1; room <= 20; room++) {
          const number = `${building}${floor}0${room > 9 ? "" : "0"}${room}`;
          const electricityUsage = 100; // Dummy usage
          const waterUsage = 100; // Dummy usage
          const electricityRate = 10; // Per unit cost
          const waterRate = 10; // Per unit cost
          const totalCost =
            electricityUsage * electricityRate +
            waterUsage * waterRate +
            " bath";
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
          });
        }
      }
    });
    return utilities;
  };

  const [utilityData, setUtilityData] = useState(generateUtilities());
  const [filteredBuilding, setFilteredBuilding] = useState("");
  const [filteredStatus, setFilteredStatus] = useState("");

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
                  This Month Usage
                </th>
                <th className="p-4">
                  <i className="bi bi-lightning-charge-fill text-[#FFA600]"></i>{" "}
                  Per Unit
                </th>
                <th className="p-4">
                  <i className="bi bi-droplet-half text-[#0775FF]"></i> This
                  Month Usage
                </th>
                <th className="p-4">
                  <i className="bi bi-droplet-half text-[#0775FF]"></i> Per Unit
                </th>
                <th className="p-4">Total Cost</th>
                <th className="p-4">Payment Status</th>
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
                  <td className="p-4 text-center">{utility.electricityRate}</td>
                  <td className="p-4 text-center">{utility.waterUsage}</td>
                  <td className="p-4 text-center">{utility.waterRate}</td>
                  <td className="p-4 text-center">{utility.totalCost}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Utility;
