"use client";

import { useState } from "react";

const Tenants = () => {
  const buildings = ["A", "B", "C"];
  const floors = Array.from({ length: 8 }, (_, i) => `${i + 1}`);
  const filters = ["Available", "Occupied"];

  // Generate rooms with statuses "Available" and "Occupied"
  const generateRooms = () => {
    let rooms = [];
    buildings.forEach((building) => {
      for (let floor = 1; floor <= 8; floor++) {
        for (let room = 1; room <= 20; room++) {
          const number = `${building}${floor}0${room > 9 ? "" : "0"}${room}`;
          const status = Math.random() > 0.5 ? "Occupied" : "Available";
          rooms.push({
            number,
            building,
            floor,
            status,
            name: "",
            phone: "",
            idLine: "",
            connectedDate: "",
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
  const [isEditing, setIsEditing] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const filteredRooms = roomCards.filter((room) => {
    const matchesBuilding = filteredBuilding
      ? room.number.startsWith(filteredBuilding)
      : true;
    const matchesFloor = filteredFloor
      ? room.floor.toString() === filteredFloor
      : true;
    const matchesStatus = filteredStatus ? room.status === filteredStatus : true;
    const matchesSearch = searchQuery
      ? room.number.includes(searchQuery)
      : true;
    return matchesBuilding && matchesFloor && matchesStatus && matchesSearch;
  });

  const handleSaveTenantInfo = (updatedRoom) => {
    setRoomCards((prev) =>
      prev.map((room) =>
        room.number === updatedRoom.number
          ? { ...updatedRoom, status: "Occupied", connectedDate: new Date().toLocaleDateString() }
          : room
      )
    );
    setSelectedRoom(null);
    setIsEditing(false);
  };

  const handleEditTenantInfo = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setConfirmationVisible(false);
    setIsEditing(false);
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
          {filteredRooms.map((room) => (
            <div
              key={room.number}
              className={`p-4 rounded-[10px] shadow flex flex-col items-center ${
                room.status === "Available"
                  ? "bg-[#E9F9F1] border border-[#009231]"
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
              <h2 className="text-lg font-bold mb-4">
                {selectedRoom.status === "Available"
                  ? "Add Tenant Information"
                  : "Room Details"}
              </h2>
              {isEditing || selectedRoom.status === "Available" ? (
                <>
                  <input
                    className="w-full p-2 mb-4 border border-gray-300 rounded"
                    placeholder="Tenant Name"
                    value={selectedRoom.name}
                    onChange={(e) =>
                      setSelectedRoom({ ...selectedRoom, name: e.target.value })
                    }
                  />
                  <input
                    className="w-full p-2 mb-4 border border-gray-300 rounded"
                    placeholder="Phone"
                    value={selectedRoom.phone}
                    onChange={(e) =>
                      setSelectedRoom({ ...selectedRoom, phone: e.target.value })
                    }
                  />
                  <input
                    className="w-full p-2 mb-4 border border-gray-300 rounded"
                    placeholder="ID Line"
                    value={selectedRoom.idLine}
                    onChange={(e) =>
                      setSelectedRoom({
                        ...selectedRoom,
                        idLine: e.target.value,
                      })
                    }
                  />
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => setConfirmationVisible(true)}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <p>Name: {selectedRoom.name}</p>
                  <p>Phone: {selectedRoom.phone}</p>
                  <p>ID Line: {selectedRoom.idLine}</p>
                  <p>
                    Connected on:{" "}
                    {selectedRoom.connectedDate || "Not connected yet"}
                  </p>
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded mt-4"
                    onClick={handleEditTenantInfo}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmationVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-[10px] w-full max-w-md text-center">
              <h2 className="text-lg font-bold mb-4">Are you sure?</h2>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                onClick={() => {
                  handleSaveTenantInfo(selectedRoom);
                  setConfirmationVisible(false);
                }}
              >
                Done
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tenants;
