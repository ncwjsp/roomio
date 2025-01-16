"use client";

import React, { useState, useEffect } from "react";

const ParcelsPage = () => {
  const [parcels, setParcels] = useState([]);
  const [newParcel, setNewParcel] = useState({
    roomNo: "",
    name: "",
    trackingNumber: "",
    building: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingParcel, setEditingParcel] = useState(null);
  const [trackingNumbersToDelete, setTrackingNumbersToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch parcels from the API
  useEffect(() => {
    fetch("/api/parcels")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch parcels");
        }
        return res.json();
      })
      .then((data) => setParcels(data))
      .catch((error) => console.error("Error fetching parcels:", error));
  }, []);

  const handleAddParcel = () => {
    fetch("/api/parcels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newParcel),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to add parcel");
        }
        return res.json();
      })
      .then((data) => {
        setParcels((prev) => [...prev, data]);
        setNewParcel({ roomNo: "", name: "", trackingNumber: "", building: "" });
      })
      .catch((error) => console.error("Error adding parcel:", error));
  };

  const handleEditParcel = () => {
    fetch("/api/parcels", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: editingParcel.trackingNumber, updates: editingParcel }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to edit parcel");
        }
        return res.json();
      })
      .then((updatedParcel) =>
        setParcels((prev) =>
          prev.map((parcel) =>
            parcel.trackingNumber === updatedParcel.trackingNumber
              ? updatedParcel
              : parcel
          )
        )
      )
      .finally(() => {
        setIsEditing(false);
        setEditingParcel(null);
      })
      .catch((error) => console.error("Error editing parcel:", error));
  };

  const handleMarkAsCollected = (trackingNumber) => {
    fetch("/api/parcels", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber, updates: { status: "collected" } }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to update parcel status");
        }
        return res.json();
      })
      .then((updatedParcel) =>
        setParcels((prev) =>
          prev.map((parcel) =>
            parcel.trackingNumber === updatedParcel.trackingNumber
              ? updatedParcel
              : parcel
          )
        )
      )
      .catch((error) => console.error("Error updating parcel status:", error));
  };

  const handleDeleteParcels = () => {
    fetch("/api/parcels", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumbers: trackingNumbersToDelete }),
    }).then(() =>
      setParcels((prev) =>
        prev.filter((parcel) => !trackingNumbersToDelete.includes(parcel.trackingNumber))
      )
    );
    setTrackingNumbersToDelete([]);
    setIsDeleting(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Parcels Management</h1>

      {/* Add Parcel Form */}
      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Add Parcel</h2>
        <input
          type="text"
          placeholder="Room No"
          value={newParcel.roomNo}
          onChange={(e) => setNewParcel({ ...newParcel, roomNo: e.target.value })}
          className="p-2 border rounded w-full mb-2"
        />
        <input
          type="text"
          placeholder="Name"
          value={newParcel.name}
          onChange={(e) => setNewParcel({ ...newParcel, name: e.target.value })}
          className="p-2 border rounded w-full mb-2"
        />
        <input
          type="text"
          placeholder="Tracking Number"
          value={newParcel.trackingNumber}
          onChange={(e) => setNewParcel({ ...newParcel, trackingNumber: e.target.value })}
          className="p-2 border rounded w-full mb-2"
        />
        <input
          type="text"
          placeholder="Building"
          value={newParcel.building}
          onChange={(e) => setNewParcel({ ...newParcel, building: e.target.value })}
          className="p-2 border rounded w-full mb-2"
        />
        <button onClick={handleAddParcel} className="p-2 bg-blue-500 text-white rounded">
          Add Parcel
        </button>
      </div>

      {/* Parcels List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Parcels List</h2>
        {parcels.map((parcel) => (
          <div
            key={parcel.trackingNumber}
            className="p-4 border rounded mb-2 bg-white"
          >
            <p>
              <strong>Room No:</strong> {parcel.roomNo}
            </p>
            <p>
              <strong>Name:</strong> {parcel.name}
            </p>
            <p>
              <strong>Tracking Number:</strong> {parcel.trackingNumber}
            </p>
            <p>
              <strong>Building:</strong> {parcel.building}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {parcel.status === "haven't collected" ? (
                <span className="text-red-500">Not Collected</span>
              ) : (
                <span className="text-green-500">Collected</span>
              )}
            </p>

            {parcel.status === "haven't collected" && (
              <button
                onClick={() => handleMarkAsCollected(parcel.trackingNumber)}
                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded mr-2"
              >
                Mark as Collected
              </button>
            )}

            <button
              onClick={() => {
                setIsEditing(true);
                setEditingParcel(parcel);
              }}
              className="p-2 bg-yellow-500 text-white rounded mr-2"
            >
              Edit
            </button>
            <button
              onClick={() =>
                setTrackingNumbersToDelete((prev) => [...prev, parcel.trackingNumber])
              }
              className="p-2 bg-red-500 text-white rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Delete */}
      {trackingNumbersToDelete.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setIsDeleting(true)}
            className="p-2 bg-red-600 text-white rounded"
          >
            Confirm Delete
          </button>
          {isDeleting && (
            <div className="p-4 border rounded bg-gray-100 mt-2">
              <p>Are you sure you want to delete the selected parcels?</p>
              <button
                onClick={handleDeleteParcels}
                className="p-2 bg-red-500 text-white rounded mr-2"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                className="p-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParcelsPage;
