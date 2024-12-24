"use client";

import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useSession } from "next-auth/react";

const Units = () => {
  const { data: session } = useSession();
  const id = session?.user?.id;

  console.log(id);

  const ROOMS_PER_PAGE = 18;

  const [buildings, setBuildings] = useState([]);
  const [roomCards, setRoomCards] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newBuilding, setNewBuilding] = useState("");
  const [newPrice, setNewPrice] = useState(5000);
  const [numFloors, setNumFloors] = useState(8);
  const [roomsPerFloor, setRoomsPerFloor] = useState(10);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        if (!session?.user?.id) {
          console.log("User ID is not available");
          return;
        }

        const response = await fetch(`/api/building?id=${id}`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch rooms");
        }

        const data = await response.json();
        setBuildings(data.buildings);
        setRoomCards(data.rooms);
      } catch (error) {
        console.error(error);
        alert("Error fetching rooms");
      }
    };

    // Trigger fetch only when user ID is available
    fetchRooms();
  }, [session]);

  // Apply filters: by building, status, and room number
  const filteredRooms = roomCards
    .filter((room) => {
      const matchesBuilding = selectedBuilding
        ? room.building === selectedBuilding
        : true;
      const matchesStatus = filterStatus ? room.status === filterStatus : true;
      const matchesSearch = searchQuery
        ? room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesBuilding && matchesStatus && matchesSearch;
    })
    .sort((a, b) => (a.status === "Available" ? -1 : 1));

  // Pagination Logic
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
    if (newBuilding.trim() && !buildings.includes(newBuilding.trim())) {
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
          throw new Error("Failed to create building");
        }

        const data = await response.json();
        // Once the building is added, update the state and close the modal
        const updatedBuildings = [...buildings, newBuilding.trim()];
        setBuildings(updatedBuildings);
        setNewBuilding("");
        setNewPrice(100);
        setNumFloors(8);
        setRoomsPerFloor(10);
        setShowModal(false);

        alert("Building added successfully!");
      } catch (error) {
        console.error(error);
        alert("Error adding building");
      }
    } else {
      alert("Building name must be unique and not empty.");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-3xl font-semibold">Units</h1>
          <div>
            <button
              className="btn btn-primary me-2"
              onClick={() => setShowModal(true)}
            >
              Add Building
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => alert("Add Room functionality coming soon!")}
            >
              Add Room
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div
          className="p-4 rounded shadow-sm mb-4"
          style={{ backgroundColor: "#898F63", color: "#fff" }}
        >
          <h4>Filter Rooms</h4>
          <div className="row g-2">
            <div className="col-md-3">
              <select
                className="form-select"
                value={selectedBuilding}
                onChange={(e) => {
                  setSelectedBuilding(e.target.value);
                  setCurrentPage(1); // Reset to first page
                }}
              >
                <option value="">All Buildings</option>
                {buildings.map((building) => (
                  <option key={building._id} value={building.name}>
                    Building {building.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1); // Reset to first page
                }}
              >
                <option value="">All Status</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
              </select>
            </div>
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search by Room Number"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page
                }}
              />
            </div>
          </div>
        </div>

        {/* Room Availability Section */}
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-6 g-2">
          {paginatedRooms.map((room) => (
            <div className="col" key={room.roomNumber}>
              <div
                className={`p-3 text-center rounded ${
                  room.status === "Available"
                    ? "text-white"
                    : "bg-light text-dark border"
                }`}
                style={{
                  backgroundColor:
                    room.status === "Available" ? "#898F63" : "white",
                  cursor: "pointer",
                }}
              >
                <h5>{room.roomNumber}</h5>
                <p className="mb-0">{room.status}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <button
              className="btn btn-outline-secondary me-2"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`btn ${
                  currentPage === idx + 1
                    ? "btn-primary"
                    : "btn-outline-secondary"
                } me-2`}
                onClick={() => handlePageChange(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="btn btn-outline-secondary"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="modal-backdrop show" style={{ zIndex: 1050 }}></div>
      )}

      {/* Add Building Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ display: "block", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Building</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Building Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    placeholder="Enter Building Name"
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="price" className="form-label">
                    Price per Room
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="price"
                    placeholder="Price per Room"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="numFloors" className="form-label">
                    Number of Floors
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="numFloors"
                    placeholder="Number of Floors"
                    value={numFloors}
                    onChange={(e) => setNumFloors(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="roomsPerFloor" className="form-label">
                    Rooms per Floor
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="roomsPerFloor"
                    placeholder="Rooms per Floor"
                    value={roomsPerFloor}
                    onChange={(e) => setRoomsPerFloor(e.target.value)}
                  />
                </div>

                {newBuilding && (
                  <div>
                    <div>
                      Room numbers will look like this:{" "}
                      <span className="font-bold">
                        {newBuilding}101-{newBuilding}
                        {numFloors}
                        {roomsPerFloor < 10 ? 0 + roomsPerFloor : roomsPerFloor}
                      </span>{" "}
                    </div>
                    <div>
                      Total rooms:{" "}
                      <span className="font-bold">
                        {numFloors * roomsPerFloor}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-sm">
                  You can add or delete rooms, and modify price for each room
                  later
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddBuilding}
                >
                  Add Building
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
