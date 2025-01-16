"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Notification from "@/app/ui/notification";

const Units = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const id = session?.user?.id;
  const ROOMS_PER_PAGE = 18;

  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const resetForm = () => {
    setNewBuilding("");
    setNewPrice(5000);
    setNumFloors(3);
    setRoomsPerFloor(10);
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        if (!session?.user?.id) return;
        setIsLoading(true);

        const response = await fetch(`/api/building?id=${session.user.id}`);
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setBuildings(data.buildings);

        // Update room cards with current building names
        const updatedRooms = data.rooms.map((room) => {
          const currentBuilding = data.buildings.find(
            (b) => b._id === (room.building._id || room.building)
          );
          return {
            ...room,
            building: currentBuilding || room.building,
          };
        });

        setRoomCards(updatedRooms);
        console.log("Updated rooms:", updatedRooms); // Debug log
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== "loading") {
      fetchRooms();
    }
  }, [session, status, refreshTrigger]);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const filteredRooms = roomCards
    .map((room) => {
      const currentBuilding = buildings.find(
        (b) => b._id === room.building._id
      );
      return {
        ...room,
        building: {
          ...room.building,
          name: currentBuilding?.name || room.building.name,
        },
      };
    })
    .filter((room) => {
      const matchesBuilding = selectedBuilding
        ? room.building.name === selectedBuilding
        : true;
      const matchesStatus = filterStatus ? room.status === filterStatus : true;
      const matchesSearch = searchQuery
        ? room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesBuilding && matchesStatus && matchesSearch;
    })
    .sort((a, b) => (a.status === "Available" ? -1 : 1));

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
            price: newPrice,
            numFloors: numFloors,
            roomsPerFloor: roomsPerFloor,
            createdBy: session?.user?.id,
          }),
        });

        if (!response.ok) {
          if (response.status === 409) {
            throw new Error("Building name must be unique");
          }
          throw new Error("Failed to create building");
        }

        const data = await response.json();
        const updatedBuildings = [...buildings, newBuilding.trim()];
        setBuildings(updatedBuildings);
        setNewBuilding("");
        setNewPrice(100);
        setNumFloors(8);
        setRoomsPerFloor(10);
        setShowModal(false);
      } catch (error) {
        setErrorMessage(error.message);
        setShowNotification(true);
      }
    } else {
      setErrorMessage("All fields are required");
      setShowNotification(true);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="container px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Units</h1>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setShowModal(true)}
          >
            Add Building
          </button>
        </div>

        {buildings.length > 0 ? (
          <>
            {/* Filter Section */}
            <div className="p-6 rounded-lg shadow-sm mb-6 bg-[#898F63] text-white">
              <h4 className="text-lg font-semibold mb-4">Filter Rooms</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  className="w-full p-2 rounded text-gray-700"
                  value={selectedBuilding}
                  onChange={(e) => {
                    setSelectedBuilding(e.target.value);
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
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={`page-${index + 1}`}
                    className={`px-4 py-2 rounded ${
                      currentPage === index + 1
                        ? "bg-blue-500 text-white"
                        : "border hover:bg-gray-100"
                    }`}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
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

          {/* {showNotification && (
            <Notification
              message={"Building created successfully"}
              duration={3000}
              onClose={() => setShowNotification(false)}
              type="good"
            />
          )} */}
        </div>
      )}
    </div>
  );
};

export default Units;
