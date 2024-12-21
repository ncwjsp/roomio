"use client";

import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const ParcelsPage = () => {
  const buildings = ["A", "B", "C"];
  const parcelsData = [];

  // Generate initial room numbers
  buildings.forEach((building) => {
    for (let floor = 1; floor <= 8; floor++) {
      for (let room = 1; room <= 10; room++) {
        const roomNo = `${building}${floor}0${room}`;
        parcelsData.push({
          roomNo,
          name: `Tenant ${roomNo}`,
          trackingNumber: `EX${Math.random().toString().slice(2, 14)}`,
          status: Math.random() > 0.5 ? "haven't collected" : "collected",
        });
      }
    }
  });

  const [parcels, setParcels] = useState(parcelsData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isAddingParcel, setIsAddingParcel] = useState(false);
  const [isEditingParcel, setIsEditingParcel] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newParcel, setNewParcel] = useState({
    roomNo: "",
    name: "",
    trackingNumber: "",
    building: "",
  });

  const filteredParcels = parcels.filter((parcel) => {
    const matchesBuilding = selectedBuilding
      ? parcel.roomNo.startsWith(selectedBuilding)
      : true;
    const matchesSearch = searchQuery
      ? parcel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parcel.trackingNumber.includes(searchQuery)
      : true;
    const matchesStatus = filterStatus
      ? parcel.status === filterStatus
      : true;
    return matchesBuilding && matchesSearch && matchesStatus;
  });

  const handleSaveEditParcel = () => {
    setParcels((prevParcels) =>
      prevParcels.map((parcel) =>
        parcel.trackingNumber === isEditingParcel.trackingNumber
          ? isEditingParcel
          : parcel
      )
    );
    setIsEditingParcel(null);
  };

  const handleDeleteSelected = () => {
    setParcels((prevParcels) =>
      prevParcels.filter((parcel) => !parcel.isSelected)
    );
    setIsDeleting(false);
  };

  const toggleSelectForDelete = (trackingNumber) => {
    setParcels((prevParcels) =>
      prevParcels.map((parcel) =>
        parcel.trackingNumber === trackingNumber
          ? { ...parcel, isSelected: !parcel.isSelected }
          : parcel
      )
    );
  };

  return (
    <div className="container py-5" style={{ backgroundColor: "#EBECE1" }}>
      <h1 className="text-center mb-5">Parcels Page</h1>

      {/* Filters Section */}
      <div
        className="p-4 rounded shadow-sm mb-4"
        style={{ backgroundColor: "#898F63", color: "white" }}
      >
        <div className="row g-2 mb-3">
          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              style={{ backgroundColor: "white" }}
            >
              <option value="">Select Building</option>
              {buildings.map((building) => (
                <option key={building} value={building}>
                  Building {building}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search Room, Parcel number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ backgroundColor: "white" }}
            >
              <option value="">Filter Status</option>
              <option value="haven't collected">Haven't Collected</option>
              <option value="collected">Collected</option>
            </select>
          </div>
        </div>

        <div className="row g-2">
          <div className="col-md-6">
            <button
              className="btn btn-warning w-100"
              onClick={() => setIsAddingParcel(true)}
            >
              Add Parcels
            </button>
          </div>
          <div className="col-md-6">
            <button
              className="btn btn-danger w-100"
              onClick={() => setIsDeleting(true)}
            >
              Delete Parcels
            </button>
          </div>
        </div>
      </div>

      {/* Add Parcel Form */}
      {isAddingParcel && (
        <div className="p-4 rounded shadow-sm mb-4" style={{ backgroundColor: "#FFF" }}>
          <h4>Add Parcel</h4>
          <div className="row g-2">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Room No."
                value={newParcel.roomNo}
                onChange={(e) =>
                  setNewParcel({ ...newParcel, roomNo: e.target.value })
                }
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tenant Name"
                value={newParcel.name}
                onChange={(e) =>
                  setNewParcel({ ...newParcel, name: e.target.value })
                }
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tracking Number"
                value={newParcel.trackingNumber}
                onChange={(e) =>
                  setNewParcel({
                    ...newParcel,
                    trackingNumber: e.target.value,
                  })
                }
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={newParcel.building}
                onChange={(e) =>
                  setNewParcel({ ...newParcel, building: e.target.value })
                }
              >
                <option value="">Select Building</option>
                {buildings.map((building) => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="btn btn-success mt-3"
            onClick={() => {
              setParcels((prevParcels) => [
                ...prevParcels,
                { ...newParcel, status: "haven't collected" },
              ]);
              setIsAddingParcel(false);
            }}
          >
            Save Parcel
          </button>
        </div>
      )}

      {/* Edit Parcel Form */}
      {isEditingParcel && (
        <div className="p-4 rounded shadow-sm mb-4" style={{ backgroundColor: "#FFF" }}>
          <h4>Edit Parcel</h4>
          <div className="row g-2">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Room No."
                value={isEditingParcel.roomNo}
                onChange={(e) =>
                  setIsEditingParcel({
                    ...isEditingParcel,
                    roomNo: e.target.value,
                  })
                }
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tenant Name"
                value={isEditingParcel.name}
                onChange={(e) =>
                  setIsEditingParcel({
                    ...isEditingParcel,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tracking Number"
                value={isEditingParcel.trackingNumber}
                onChange={(e) =>
                  setIsEditingParcel({
                    ...isEditingParcel,
                    trackingNumber: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <button
            className="btn btn-success mt-3"
            onClick={handleSaveEditParcel}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Parcels List */}
      <div className="row g-3">
        {filteredParcels.map((parcel) => (
          <div
            key={parcel.trackingNumber}
            className="col-md-12 d-flex align-items-center justify-content-between p-3 shadow-sm rounded"
            style={{
              backgroundColor: "white",
              border: "1px solid #D9D9D9",
            }}
          >
            {isDeleting && (
              <input
                type="checkbox"
                className="form-check-input me-3"
                checked={parcel.isSelected || false}
                onChange={() => toggleSelectForDelete(parcel.trackingNumber)}
              />
            )}
            <div className="d-flex align-items-center gap-3">
              <i
                className="bi bi-box-seam-fill"
                style={{ fontSize: "1.5rem", color: "#898F63" }}
              ></i>
              <div>
                <p className="mb-0">Room no. {parcel.roomNo}</p>
                <p className="mb-0">Name: {parcel.name}</p>
                <p className="mb-0">Tracking number: {parcel.trackingNumber}</p>
              </div>
            </div>
            <div>
              {parcel.status === "haven't collected" ? (
                <button
                  className="btn btn-sm btn-primary me-2"
                  onClick={() => setIsEditingParcel(parcel)}
                >
                  Edit
                </button>
              ) : null}
              {parcel.status === "haven't collected" ? (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() =>
                    setParcels((prevParcels) =>
                      prevParcels.map((p) =>
                        p.trackingNumber === parcel.trackingNumber
                          ? { ...p, status: "collected" }
                          : p
                      )
                    )
                  }
                >
                  Mark as Collected
                </button>
              ) : (
                <span
                  className="badge"
                  style={{
                    backgroundColor: "#006400",
                    color: "white",
                    fontSize: "1rem",
                  }}
                >
                  Collected
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {isDeleting && (
        <button
          className="btn btn-danger mt-3 position-fixed top-0 end-0 m-4"
          onClick={handleDeleteSelected}
        >
          Delete Selected
        </button>
      )}
    </div>
  );
};

export default ParcelsPage;
