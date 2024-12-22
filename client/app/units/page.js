"use client";

import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const Units = () => {
  const buildings = ["A", "B", "C"];
  const roomTypes = ["Studio", "One-Bedroom", "Duplex"];
  const roomDetails = {
    Studio: {
      size: "30 sqm",
      price: "10,000 THB/month",
      features: "1 Room, 1 Bathroom, 1 Kitchen",
      capacity: "2 persons",
      floors: ["4", "5", "6"],
      images: [
        "/images/studio.jpeg",
        "/images/studio_bath1.jpeg",
        "/images/studio_bath2.jpeg",
      ],
    },
    "One-Bedroom": {
      size: "45 sqm",
      price: "15,000 THB/month",
      features: "1 Bedroom, 1 Bathroom, 1 Kitchen",
      capacity: "2 persons",
      floors: ["1", "2", "3"],
      images: [
        "/images/ob.jpeg",
        "/images/ob_living.jpeg",
        "/images/ob_bath.jpeg",
      ],
    },
    Duplex: {
      size: "70 sqm",
      price: "25,000 THB/month",
      features: "2 Bedrooms, 2 Bathrooms, 1 Kitchen",
      capacity: "4 persons",
      floors: ["7", "8"],
      images: [
        "/images/duplex.jpeg",
        "/images/duplex_bath.jpeg",
        "/images/duplex_wash.jpeg",
      ],
    },
  };

  const generateRooms = () => {
    let rooms = [];
    buildings.forEach((building) => {
      for (let floor = 1; floor <= 8; floor++) {
        for (let room = 1; room <= 10; room++) {
          const number = `${building}${floor}${room.toString().padStart(2, "0")}`; // Generate room number in 3-digit format
          const status = Math.random() > 0.7 ? "Available" : "Occupied";
          rooms.push({ number, building, floor, status, tenant: null });
        }
      }
    });
    return rooms;
  };  

  const [roomCards, setRoomCards] = useState(generateRooms());
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // Filter by status (Available or Occupied)
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [showRooms, setShowRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const filteredRooms = roomCards
    .filter((room) => {
      const matchesBuilding = selectedBuilding
        ? room.number.startsWith(selectedBuilding)
        : true;
      const matchesRoomType = selectedRoomType
        ? roomDetails[selectedRoomType]?.floors.includes(room.floor.toString())
        : true;
      const matchesStatus = filterStatus
        ? room.status === filterStatus
        : true;
      return matchesBuilding && matchesRoomType && matchesStatus;
    })
    .sort((a, b) => (a.status === "Available" ? -1 : 1)); // Sort Available rooms first

  const handleRoomTypeClick = (type) => {
    setSelectedRoomType(type);
  };

  const handleSaveTenant = (roomNumber, tenant) => {
    setRoomCards((prev) =>
      prev.map((room) =>
        room.number === roomNumber
          ? { ...room, tenant, status: "Occupied" }
          : room
      )
    );
    setSelectedRoom(null);
  };

  const handleDeleteTenant = (roomNumber) => {
    setRoomCards((prev) =>
      prev.map((room) =>
        room.number === roomNumber
          ? { ...room, tenant: null, status: "Available" }
          : room
      )
    );
    setSelectedRoom(null);
  };

  return (
    <div className="container py-5">
      <h1 className="text-center mb-5">Units</h1>

      {/* Room Types Section */}
      {!showRooms && (
        <div className="row g-4">
          {roomTypes.map((type, index) => (
            <div
              key={index}
              className="col-md-4"
              onClick={() => handleRoomTypeClick(type)}
            >
              <div className="card shadow-sm" style={{ width: "18rem" }}>
                <div
                  id={`carousel-${type}`}
                  className="carousel slide"
                  data-bs-ride="carousel"
                >
                  <div className="carousel-inner">
                    {roomDetails[type].images.map((image, idx) => (
                      <div
                        className={`carousel-item ${idx === 0 ? "active" : ""}`}
                        key={idx}
                      >
                        <img
                          src={image}
                          className="d-block w-100"
                          alt={`${type} Room`}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    className="carousel-control-prev"
                    type="button"
                    data-bs-target={`#carousel-${type}`}
                    data-bs-slide="prev"
                  >
                    <span
                      className="carousel-control-prev-icon"
                      aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target={`#carousel-${type}`}
                    data-bs-slide="next"
                  >
                    <span
                      className="carousel-control-next-icon"
                      aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </div>
                <div className="card-body">
                  <h5 className="card-title">{type}</h5>
                  <p className="card-text">
                    <strong>Size:</strong> {roomDetails[type].size}
                  </p>
                  <p className="card-text">
                    <strong>Price:</strong> {roomDetails[type].price}
                  </p>
                  <p className="card-text">
                    <strong>Features:</strong> {roomDetails[type].features}
                  </p>
                  <p className="card-text">
                    <strong>Capacity:</strong> {roomDetails[type].capacity}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Section */}
      {selectedRoomType && !showRooms && (
        <div
          className="p-4 rounded shadow-sm my-4"
          style={{ backgroundColor: "#898F63", color: "#fff" }}
        >
          <h4>Filter by Building</h4>
          <div className="row g-2">
            <div className="col-md-4">
              <select
                className="form-select"
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
              >
                <option value="">Select Building</option>
                {buildings.map((building) => (
                  <option key={building} value={building}>
                    Building {building}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button
                className="btn"
                style={{
                  backgroundColor: "white",
                  color: "#898F63",
                  width: "100%",
                  border: "1px solid #898F63",
                }}
                onClick={() => setShowRooms(true)}
              >
                Show Rooms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Availability Section */}
      {showRooms && (
        <div>
          <button
            className="btn mb-4"
            style={{ backgroundColor: "#898F63", color: "#fff" }}
            onClick={() => {
              setSelectedBuilding("");
              setFilterStatus("");
              setSelectedRoomType("");
              setShowRooms(false);
            }}
          >
            Back
          </button>
          <div className="row g-3">
            {filteredRooms.map((room) => (
              <div
                key={room.number}
                className={`col-md-2 p-3 text-center rounded ${
                  room.status === "Available"
                    ? "text-white"
                    : "bg-light text-dark border"
                }`}
                style={{
                  backgroundColor:
                    room.status === "Available" ? "#898F63" : "white",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedRoom(room)}
              >
                <h5>{room.number}</h5>
                <p className="mb-0">{room.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Details Modal */}
      {selectedRoom && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Room {selectedRoom.number}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedRoom(null)}
                ></button>
              </div>
              <div className="modal-body">
                {selectedRoom.status === "Occupied" ? (
                  <div>
                    <h6>Tenant Information</h6>
                    <p>
                      <strong>Name:</strong> {selectedRoom.tenant?.name || ""}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedRoom.tenant?.phone || ""}
                    </p>
                    <p>
                      <strong>Line ID:</strong> {selectedRoom.tenant?.lineID || ""}
                    </p>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteTenant(selectedRoom.number)}
                    >
                      Remove Tenant
                    </button>
                  </div>
                ) : (
                  <div>
                    <h6>Add Tenant</h6>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const name = e.target.name.value;
                        const phone = e.target.phone.value;
                        const lineID = e.target.lineID.value;
                        handleSaveTenant(selectedRoom.number, { name, phone, lineID });
                      }}
                    >
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Phone</label>
                        <input
                          type="text"
                          name="phone"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Line ID</label>
                        <input
                          type="text"
                          name="lineID"
                          className="form-control"
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary">
                        Save Tenant
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Units;
