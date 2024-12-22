"use client";

import { useState } from "react";

const MaintenancePage = () => {
  const buildings = ["A", "B", "C"];
  const floors = Array.from({ length: 8 }, (_, i) => `${i + 1}`);
  const workTypes = ["Plumber", "Electrician"];
  const maintenanceStatuses = ["successful", "in process", "waiting"];

  const generateMaintenanceData = () => {
    let maintenanceRequests = [];
    buildings.forEach((building) => {
      for (let floor = 1; floor <= 8; floor++) {
        for (let room = 1; room <= 10; room++) {
          const roomNo = `${building}${floor}0${room}`;
          const workType = Math.random() > 0.5 ? "Plumber" : "Electrician";
          let status = Math.random() > 0.7
            ? "successful"
            : Math.random() > 0.5
            ? "in process"
            : "waiting";
          let assignedTo =
            status === "waiting" && Math.random() > 0.5
              ? "Not Assigned"
              : `Worker${Math.ceil(Math.random() * 4)}`;

          // Validation for successful and in process work
          if ((status === "successful" || status === "in process") && assignedTo === "Not Assigned") {
            status = "waiting"; // Revert status to waiting if no worker is assigned
          }

          maintenanceRequests.push({
            roomNo,
            building,
            name: `Tenant ${roomNo}`,
            date: new Date(
              2022,
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            ).toLocaleDateString("en-GB"),
            workType,
            status,
            assignedTo,
          });
        }
      }
    });
    return maintenanceRequests;
  };

  const [maintenanceData, setMaintenanceData] = useState(generateMaintenanceData());
  const [filteredBuilding, setFilteredBuilding] = useState("");
  const [filteredFloor, setFilteredFloor] = useState("");
  const [filteredWorkType, setFilteredWorkType] = useState("");
  const [filteredStatus, setFilteredStatus] = useState("");

  const filteredMaintenanceRequests = maintenanceData.filter((request) => {
    const matchesBuilding = filteredBuilding
      ? request.building === filteredBuilding
      : true;
    const matchesFloor = filteredFloor
      ? request.roomNo.startsWith(filteredBuilding + filteredFloor)
      : true;
    const matchesWorkType = filteredWorkType
      ? request.workType === filteredWorkType
      : true;
    const matchesStatus = filteredStatus
      ? request.status === filteredStatus
      : true;
    return (
      matchesBuilding && matchesFloor && matchesWorkType && matchesStatus
    );
  });

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Maintenance Page</h1>

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
            >
              <option value="">Select Floor</option>
              {floors.map((floor) => (
                <option key={floor} value={floor}>
                  Floor {floor}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 bg-white rounded-[10px] border border-gray-300"
              value={filteredWorkType}
              onChange={(e) => setFilteredWorkType(e.target.value)}
            >
              <option value="">Select Work Type</option>
              {workTypes.map((workType) => (
                <option key={workType} value={workType}>
                  {workType}
                </option>
              ))}
            </select>
          </div>
          <select
            className="px-4 py-2 bg-white rounded-[10px] border border-gray-300"
            value={filteredStatus}
            onChange={(e) => setFilteredStatus(e.target.value)}
          >
            <option value="">Select Status</option>
            {maintenanceStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-[#898F63] text-white">
              <tr>
                <th className="p-4">Room No.</th>
                <th className="p-4">Building</th>
                <th className="p-4">Firstname-Lastname</th>
                <th className="p-4">DD/MM/YY</th>
                <th className="p-4">Work Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaintenanceRequests.map((request, index) => (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } text-gray-700`}
                >
                  <td className="p-4 text-center">{request.roomNo}</td>
                  <td className="p-4 text-center">{request.building}</td>
                  <td className="p-4 text-center">{request.name}</td>
                  <td className="p-4 text-center">{request.date}</td>
                  <td className="p-4 text-center">{request.workType}</td>
                  <td
                    className={`p-4 text-center font-semibold ${
                      request.status === "successful"
                        ? "text-[#009231]"
                        : request.status === "in process"
                        ? "text-[#FFA600]"
                        : "text-[#F30505]"
                    }`}
                  >
                    {request.status}
                  </td>
                  <td className="p-4 text-center">{request.assignedTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
