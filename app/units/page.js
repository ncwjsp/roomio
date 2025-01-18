"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Notification from "@/app/ui/notification";
import { CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const Units = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const id = session?.user?.id;
  const ROOMS_PER_PAGE = 18;

  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [buildings, setBuildings] = useState([]);
  const [roomCards, setRoomCards] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newBuilding, setNewBuilding] = useState("");
  const [newPrice, setNewPrice] = useState(5000);
  const [numFloors, setNumFloors] = useState(3);
  const [roomsPerFloor, setRoomsPerFloor] = useState(10);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [selectedBuildingForRoom, setSelectedBuildingForRoom] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [roomPrice, setRoomPrice] = useState(5000);
  const [selectedBuildingData, setSelectedBuildingData] = useState(null);

  const resetForm = () => {
    setNewBuilding("");
    setNewPrice(5000);
    setNumFloors(3);
    setRoomsPerFloor(10);
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      if (!session?.user?.id) return;
      setIsLoading(true);

      const response = await fetch(`/api/building?id=${session.user.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch buildings");
      }

      const data = await response.json();

      if (data.buildings) {
        // Transform the data to include floor information
        const transformedBuildings = data.buildings.map((building) => ({
          ...building,
          name: building.name,
          floors: building.floors.map((floor) => ({
            ...floor,
            floorNumber: floor.floorNumber,
            rooms: floor.rooms,
          })),
        }));

        setBuildings(transformedBuildings);

        // Transform rooms to include floor and building info
        const allRooms = transformedBuildings.reduce((acc, building) => {
          const buildingRooms = building.floors.reduce((floorAcc, floor) => {
            const roomsWithInfo = floor.rooms.map((room) => ({
              ...room,
              floor: {
                _id: floor._id,
                floorNumber: floor.floorNumber,
              },
              building: {
                _id: building._id,
                name: building.name,
              },
            }));
            return [...floorAcc, ...roomsWithInfo];
          }, []);
          return [...acc, ...buildingRooms];
        }, []);

        setRoomCards(allRooms);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setErrorMessage("Failed to fetch buildings and rooms");
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchBuildings();
  };

  const getFloorOptions = () => {
    if (selectedBuilding && selectedBuilding !== "") {
      // If a building is selected, only show floors from that building
      const building = buildings.find((b) => b.name === selectedBuilding);
      if (building) {
        return building.floors
          .map((floor) => floor.floorNumber)
          .sort((a, b) => a - b);
      }
      return [];
    }

    // If no building is selected, show all floors from all buildings
    const allFloors = buildings.flatMap((building) =>
      building.floors.map((floor) => floor.floorNumber)
    );

    return [...new Set(allFloors)].sort((a, b) => a - b);
  };

  const filteredRooms = roomCards
    .filter((room) => {
      const matchesBuilding = selectedBuilding
        ? room.building.name === selectedBuilding
        : true;
      const matchesStatus = filterStatus ? room.status === filterStatus : true;
      const matchesSearch = searchQuery
        ? room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesFloor = selectedFloor
        ? room.floor.floorNumber === parseInt(selectedFloor)
        : true;

      return matchesBuilding && matchesStatus && matchesSearch && matchesFloor;
    })
    .sort((a, b) => {
      // Sort by room number only
      return a.roomNumber.localeCompare(b.roomNumber, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

  const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * ROOMS_PER_PAGE,
    currentPage * ROOMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddBuilding = async () => {
    if (newBuilding.trim()) {
      try {
        const response = await fetch("/api/building", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newBuilding.trim(),
            price: Number(newPrice),
            totalFloors: Number(numFloors),
            roomsPerFloor: Number(roomsPerFloor),
            userId: session?.user?.id,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create building");
        }

        setSuccessMessage(`Building ${newBuilding} was successfully created!`);
        setShowNotification(true);
        refreshData();
        setShowModal(false);
        resetForm();

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
          setShowNotification(false);
        }, 3000);
      } catch (error) {
        setErrorMessage(error.message);
        setShowNotification(true);
      }
    } else {
      setErrorMessage("Building name is required");
      setShowNotification(true);
    }
  };

  useEffect(() => {
    if (selectedBuildingForRoom) {
      const building = buildings.find((b) => b._id === selectedBuildingForRoom);
      setSelectedBuildingData(building);
      // Reset floor when building changes
      setSelectedFloor("");
    }
  }, [selectedBuildingForRoom, buildings]);

  const handleAddRoom = async () => {
    try {
      const response = await fetch("/api/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buildingId: selectedBuildingForRoom,
          roomNumber: newRoomNumber,
          floor: selectedFloor,
          price: roomPrice,
          createdBy: session?.user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create room");
      }

      setShowAddRoomModal(false);
      refreshData();
      resetRoomForm();
    } catch (error) {
      setErrorMessage(error.message);
      setShowNotification(true);
    }
  };

  const resetRoomForm = () => {
    setNewRoomNumber("");
    setSelectedBuildingForRoom("");
    setSelectedFloor("");
    setRoomPrice(5000);
    setSelectedBuildingData(null);
  };

  // Add this helper function to generate page numbers with ellipsis
  const getPageNumbers = (currentPage, totalPages) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="container px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Units</h1>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center"
              onClick={refreshData}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
              onClick={() => setShowAddRoomModal(true)}
            >
              <AddIcon className="mr-1" /> Add Room
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setShowModal(true)}
            >
              Add Building
            </button>
          </div>
        </div>

        {/* Notification Component */}
        {showNotification && (successMessage || errorMessage) && (
          <Notification
            message={successMessage || errorMessage}
            duration={3000}
            onClose={() => {
              setShowNotification(false);
              setSuccessMessage("");
              setErrorMessage("");
            }}
            type={successMessage ? "good" : "bad"}
          />
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CircularProgress size={40} sx={{ color: "#898F63" }} />
            <p className="mt-4 text-gray-600">Loading units...</p>
          </div>
        ) : buildings.length > 0 ? (
          <>
            {/* Filter Section */}
            <div className="p-6 rounded-lg shadow-sm mb-6 bg-[#898F63] text-white">
              <h4 className="text-lg font-semibold mb-4">Filter Rooms</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  className="w-full p-2 rounded text-gray-700"
                  value={selectedBuilding}
                  onChange={(e) => {
                    setSelectedBuilding(e.target.value);
                    setSelectedFloor(""); // Reset floor when building changes
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Buildings</option>
                  {buildings.map((building) => (
                    <option key={building._id} value={building.name}>
                      Building {building.name}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full p-2 rounded text-gray-700"
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Floors</option>
                  {getFloorOptions().map((floorNum) => (
                    <option key={floorNum} value={floorNum}>
                      Floor {floorNum}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full p-2 rounded text-gray-700"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                </select>

                <input
                  type="text"
                  className="w-full p-2 rounded text-gray-700"
                  placeholder="Search by Room Number"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {paginatedRooms.map((room) => (
                <div
                  key={room._id}
                  className={`p-4 rounded-lg text-center cursor-pointer ${
                    room.status === "Available"
                      ? "bg-[#898F63] text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  <h5 className="text-lg font-semibold">{room.roomNumber}</h5>
                  <p className="text-sm">{room.status}</p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-1">
                {/* Previous page button */}
                <button
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#898F63] text-white hover:bg-[#6B7355]"
                  }`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ←
                </button>

                {/* Page numbers */}
                {getPageNumbers(currentPage, totalPages).map(
                  (pageNum, index) => (
                    <button
                      key={index}
                      className={`px-3 py-1 rounded ${
                        pageNum === currentPage
                          ? "bg-white text-[#898F63] font-semibold"
                          : pageNum === "..."
                          ? "bg-transparent text-gray-500 cursor-default"
                          : "bg-[#898F63] text-white hover:bg-[#6B7355]"
                      }`}
                      onClick={() =>
                        pageNum !== "..." && handlePageChange(pageNum)
                      }
                      disabled={pageNum === "..."}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                {/* Next page button */}
                <button
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#898F63] text-white hover:bg-[#6B7355]"
                  }`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4 text-gray-600">
              You don't have any buildings yet
            </div>
            <div className="text-sm text-gray-500">
              Click the "Add Building" button above to create your first
              building
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white rounded-lg w-full max-w-md p-6">
              <div className="mb-4 flex justify-between items-center">
                <h5 className="text-xl font-semibold">Add Building</h5>
                <button
                  className="text-gray-500 bg-white text-3xl hover:text-gray-700"
                  onClick={() => {
                    setShowModal(false);
                    setShowNotification(false);
                    resetForm();
                  }}
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Building Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Enter Building Name"
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price per Room
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Number of Floors
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={numFloors}
                    onChange={(e) => setNumFloors(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Rooms per Floor
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={roomsPerFloor}
                    onChange={(e) => setRoomsPerFloor(e.target.value)}
                    required
                  />
                </div>

                {newBuilding && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <div className="mb-2">
                      Room numbers will look like this:{" "}
                      <span className="font-bold">
                        {newBuilding}101-{newBuilding}
                        {numFloors}
                        {roomsPerFloor < 10
                          ? "0" + roomsPerFloor
                          : roomsPerFloor}
                      </span>
                    </div>
                    <div>
                      Total rooms:{" "}
                      <span className="font-bold">
                        {numFloors * roomsPerFloor}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  You can add or delete rooms, and modify price for each room
                  later
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => {
                    setShowModal(false);
                    setShowNotification(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                  onClick={handleAddBuilding}
                >
                  Add Building
                </button>
              </div>
            </div>
          </div>
          {showNotification && errorMessage && (
            <Notification
              message={errorMessage}
              duration={3000}
              onClose={() => setShowNotification(false)}
              type="bad"
            />
          )}
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white rounded-lg w-full max-w-md p-6">
              <div className="mb-4 flex justify-between items-center">
                <h5 className="text-xl font-semibold">Add Room</h5>
                <button
                  className="text-gray-500 bg-white text-3xl hover:text-gray-700"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    resetRoomForm();
                  }}
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select Building
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedBuildingForRoom}
                    onChange={(e) => setSelectedBuildingForRoom(e.target.value)}
                    required
                  >
                    <option value="">Select a building</option>
                    {buildings.map((building) => (
                      <option key={building._id} value={building._id}>
                        Building {building.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Floor Number
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    required
                    disabled={!selectedBuildingForRoom}
                  >
                    <option value="">Select floor</option>
                    {getFloorOptions().map((floor) => (
                      <option key={floor} value={floor}>
                        Floor {floor}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder={
                      selectedBuildingData
                        ? `e.g., ${selectedBuildingData.name}${selectedFloor}01`
                        : "Select a building first"
                    }
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Suggested format: Building{selectedFloor}XX
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Room Price
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={roomPrice}
                    onChange={(e) => setRoomPrice(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    resetRoomForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
                  onClick={handleAddRoom}
                >
                  Add Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Units;
