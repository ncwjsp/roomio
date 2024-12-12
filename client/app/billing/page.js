"use client";

import { useState, useEffect } from "react";

const Billing = () => {
  const buildings = ["A", "B", "C"];
  const floors = Array.from({ length: 8 }, (_, i) => `${i + 1}th`);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = ["2022", "2023", "2024"];

  const generateRooms = () => {
    let rooms = [];
    buildings.forEach((building) => {
      for (let floor = 1; floor <= 8; floor++) {
        for (let room = 1; room <= 20; room++) {
          const roomNumber = `${building}${floor}0${room > 9 ? "" : "0"}${room}`;
          rooms.push({
            roomNumber,
            tenantName: `Tenant ${roomNumber}`,
            rentalStatus:
              Math.random() > 0.7
                ? "Overdue"
                : Math.random() > 0.5
                ? "Unpaid"
                : "Paid",
            waterStatus:
              Math.random() > 0.7
                ? "Overdue"
                : Math.random() > 0.5
                ? "Unpaid"
                : "Paid",
            electricStatus:
              Math.random() > 0.7
                ? "Overdue"
                : Math.random() > 0.5
                ? "Unpaid"
                : "Paid",
            bank: "Kasikorn Bank",
            receipt: "Receipt URL Here",
          });
        }
      }
    });
    return rooms;
  };

  const [rooms, setRooms] = useState([]);
  const [filteredBuilding, setFilteredBuilding] = useState("");
  const [filteredFloor, setFilteredFloor] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("January");
  const [selectedYear, setSelectedYear] = useState("2022");

  useEffect(() => {
    setRooms(generateRooms());
  }, []);

  const filteredRooms = rooms.filter((room) => {
    const matchesBuilding = filteredBuilding
      ? room.roomNumber.startsWith(filteredBuilding)
      : true;
    const matchesFloor = filteredFloor
      ? room.roomNumber.includes(`${filteredBuilding}${filteredFloor}`)
      : true;
    return matchesBuilding && matchesFloor;
  });

  const handleClose = () => {
    setSelectedRoom(null);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Billing</h1>

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
            <div className="grid grid-cols-2 gap-4">
              <select
                className="px-4 py-2 bg-white rounded-[10px] border border-gray-300"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                className="px-4 py-2 bg-white rounded-[10px] border border-gray-300"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room Cards Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredRooms.map((room, index) => (
              <div
                key={index}
                className="p-4 rounded-[10px] shadow flex flex-col items-center bg-white cursor-pointer"
                onClick={() => setSelectedRoom(room)}
              >
                <i className="bi bi-person-fill text-[#898F63] text-2xl"></i>
                <p className="text-lg font-bold mt-2">{room.roomNumber}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Details Modal */}
        {selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white p-6 rounded-[10px] shadow-lg max-w-md w-full relative">
              <button
                className="absolute top-2 right-2 text-black text-2xl"
                onClick={handleClose}
              >
                <i className="bi bi-x"></i>
              </button>
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
              <p>
                <strong>Building:</strong> {selectedRoom.roomNumber[0]}
              </p>
              <p>
                <strong>Room:</strong> {selectedRoom.roomNumber}
              </p>
              <p>
                <strong>Tenant:</strong> {selectedRoom.tenantName}
              </p>
              <p>
                <strong>Rental Status:</strong>{" "}
                <span
                  className={`${
                    selectedRoom.rentalStatus === "Paid"
                      ? "text-green-500"
                      : selectedRoom.rentalStatus === "Unpaid"
                      ? "text-orange-500"
                      : "text-red-500"
                  }`}
                >
                  {selectedRoom.rentalStatus}
                </span>
              </p>
              <p>
                <strong>Water Status:</strong>{" "}
                <span
                  className={`${
                    selectedRoom.waterStatus === "Paid"
                      ? "text-green-500"
                      : selectedRoom.waterStatus === "Unpaid"
                      ? "text-orange-500"
                      : "text-red-500"
                  }`}
                >
                  {selectedRoom.waterStatus}
                </span>
              </p>
              <p>
                <strong>Electric Status:</strong>{" "}
                <span
                  className={`${
                    selectedRoom.electricStatus === "Paid"
                      ? "text-green-500"
                      : selectedRoom.electricStatus === "Unpaid"
                      ? "text-orange-500"
                      : "text-red-500"
                  }`}
                >
                  {selectedRoom.electricStatus}
                </span>
              </p>
              <p>
                <strong>Bank:</strong> {selectedRoom.bank}
              </p>
              <p>
                <strong>Receipt:</strong> {selectedRoom.receipt}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
