"use client";

import { useState } from "react";

const Tenants = () => {
  const buildings = ["A", "B", "C"];
  const floors = Array.from({ length: 8 }, (_, i) => `${i + 1}th`);
  const filters = ["Paid", "Unpaid", "Overdue"];

  const generateRooms = () => {
    let rooms = [];
    buildings.forEach((building) => {
      for (let floor = 1; floor <= 8; floor++) {
        for (let room = 1; room <= 20; room++) {
          const number = `${building}${floor}0${room > 9 ? "" : "0"}${room}`;
          const status =
            Math.random() > 0.7
              ? "Overdue"
              : Math.random() > 0.5
              ? "Unpaid"
              : "Paid";
          rooms.push({ number, status });
        }
      }
    });
    return rooms;
  };

  const [roomCards, setRoomCards] = useState(generateRooms());
  const [filteredBuilding, setFilteredBuilding] = useState("");
  const [filteredFloor, setFilteredFloor] = useState("");
  const [filteredStatus, setFilteredStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRooms = roomCards.filter((room) => {
    const matchesBuilding = filteredBuilding
      ? room.number.startsWith(filteredBuilding)
      : true;
    const matchesFloor = filteredFloor
      ? room.number.includes(`${filteredBuilding}${filteredFloor}`)
      : true;
    const matchesStatus = filteredStatus ? room.status === filteredStatus : true;
    const matchesSearch = searchQuery
      ? room.number.includes(searchQuery.toUpperCase())
      : true;
    return matchesBuilding && matchesFloor && matchesStatus && matchesSearch;
  });

  const roomStats = [
    {
      title: "Occupancy rate",
      value: "80%",
      icon: "bi bi-people-fill",
      iconColor: "text-[#898F63]",
      bgColor: "bg-[#D9D9D9]",
    },
    {
      title: "Vacant room",
      value: "10 rooms",
      icon: "bi bi-door-open-fill",
      iconColor: "text-[#898F63]",
      bgColor: "bg-[#D9D9D9]",
    },
    {
      title: "Booking room",
      value: "2 rooms",
      icon: "bi bi-calendar2-check-fill",
      iconColor: "text-[#898F63]",
      bgColor: "bg-[#D9D9D9]",
    },
    {
      title: "Overdue",
      value: "25 rooms",
      icon: "bi bi-cash-coin",
      iconColor: "text-[#898F63]",
      bgColor: "bg-[#D9D9D9]",
    },
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Tenants</h1>

        {/* Filters and Stats Section */}
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
          </div>

          {/* Search and Filter Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
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
            <select
              className="px-4 py-2 bg-white rounded-[10px] border border-gray-300"
              value={filteredStatus}
              onChange={(e) => setFilteredStatus(e.target.value)}
            >
              <option value="">Filter Rooms</option>
              {filters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </div>

          {/* Room Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roomStats.map((stat, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-[10px] shadow flex justify-between items-center"
              >
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                </div>
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${stat.bgColor}`}
                >
                  <i className={`${stat.icon} ${stat.iconColor} text-xl`}></i>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredRooms.map((room, index) => (
            <div
              key={index}
              className={`p-4 rounded-[10px] shadow flex flex-col items-center ${
                room.status === "Paid"
                  ? "bg-[#E9F9F1] border border-[#009231]"
                  : room.status === "Unpaid"
                  ? "bg-[#FFF5CC] border border-[#FFA600]"
                  : "bg-[#FDEAEA] border border-[#F30505]"
              }`}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  room.status === "Paid"
                    ? "bg-[#D9F9D9]"
                    : room.status === "Unpaid"
                    ? "bg-[#FFF2E0]"
                    : "bg-[#FDDADA]"
                }`}
              >
                <i className="bi bi-people-fill text-[#898F63] text-lg"></i>
              </div>
              <p className="text-lg font-bold mt-2">{room.number}</p>
              <p
                className={`text-sm ${
                  room.status === "Paid"
                    ? "text-[#009231]"
                    : room.status === "Unpaid"
                    ? "text-[#FFA600]"
                    : "text-[#F30505]"
                }`}
              >
                {room.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tenants;