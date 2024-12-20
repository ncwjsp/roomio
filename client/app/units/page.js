"use client";

import { useState } from "react";

const Units = () => {
  const buildings = ["A", "B", "C"];
  const floors = Array.from({ length: 8 }, (_, i) => `${i + 1}`);
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
          rooms.push({
            number,
            building,
            floor,
            status,
            name: `Tenant ${number}`,
            phone: `012-345-${number.slice(-3)}`,
            connectedDate: "18/08/2022",
          });
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
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredRooms = roomCards.filter((room) => {
    const matchesBuilding = filteredBuilding
      ? room.number.startsWith(filteredBuilding)
      : true;
    const matchesFloor = filteredFloor
      ? room.floor.toString() === filteredFloor
      : true;
    const matchesStatus = filteredStatus
      ? room.status === filteredStatus
      : true;
    const matchesSearch = searchQuery
      ? room.number.includes(searchQuery)
      : true;
    return matchesBuilding && matchesFloor && matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (roomNumber) => {
    setRoomCards((prev) => prev.filter((room) => room.number !== roomNumber));
    setSelectedRoom(null);
  };

  const handleMoveRoom = (oldRoomNumber, newRoomNumber) => {
    setRoomCards((prev) =>
      prev.map((room) =>
        room.number === oldRoomNumber
          ? { ...room, number: newRoomNumber }
          : room
      )
    );
    setSelectedRoom(null);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Tenants</h1>

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
              {floors.map((floor) => (
                <option key={floor} value={floor}>
                  {floor} Floor
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
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
        </div>

        {/* Room Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {paginatedRooms.map((room) => (
            <div
              key={room.number}
              className={`p-4 rounded-[10px] shadow flex flex-col items-center ${
                room.status === "Paid"
                  ? "bg-[#E9F9F1] border border-[#009231]"
                  : room.status === "Unpaid"
                  ? "bg-[#FFF5CC] border border-[#FFA600]"
                  : "bg-[#FDEAEA] border border-[#F30505]"
              }`}
              onClick={() => setSelectedRoom(room)}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full bg-[#D9D9D9]`}
              >
                <i className="bi bi-people-fill text-[#898F63] text-lg"></i>
              </div>
              <p className="text-lg font-bold mt-2">{room.number}</p>
            </div>
          ))}
        </div>

        {/* Pagination Section */}
        <div className="flex justify-center mt-6">
          <button
            className="px-4 py-2 bg-gray-200 rounded-md mx-1"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-gray-100 rounded-md mx-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-4 py-2 bg-gray-200 rounded-md mx-1"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>

        {/* Modal */}
        {selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-[10px] w-full max-w-md relative">
              <button
                className="absolute top-3 right-3 text-gray-500"
                onClick={() => setSelectedRoom(null)}
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4">Room Details</h2>
              <p>Building: {selectedRoom.building}</p>
              <p>Floor: {selectedRoom.floor}th</p>
              <p>Room No.: {selectedRoom.number}</p>
              <p>Name: {selectedRoom.name}</p>
              <p>Phone: {selectedRoom.phone}</p>
              <p>
                Connected with the apartment at: {selectedRoom.connectedDate}
              </p>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded mt-4"
                onClick={() => handleDelete(selectedRoom.number)}
              >
                Delete Tenant
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded mt-4 ml-4"
                onClick={() => {
                  const newRoom = prompt("Enter new room number:");
                  if (newRoom) handleMoveRoom(selectedRoom.number, newRoom);
                }}
              >
                Move Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Units;
