"use client";

import { useState, useEffect } from "react";

const ParcelsPage = () => {
  const buildings = ["A", "B", "C"];
  const [parcelsData, setParcelsData] = useState([]);
  const [parcels, setParcels] = useState([]);
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

  // Initialize data on client-side only
  useEffect(() => {
    const initialParcelsData = [];
    buildings.forEach((building) => {
      for (let floor = 1; floor <= 8; floor++) {
        for (let room = 1; room <= 10; room++) {
          const roomNo = `${building}${floor}0${room}`;
          initialParcelsData.push({
            roomNo,
            name: `Tenant ${roomNo}`,
            trackingNumber: `EX${Math.random().toString().slice(2, 14)}`,
            status: Math.random() > 0.5 ? "haven't collected" : "collected",
          });
        }
      }
    });
    setParcelsData(initialParcelsData);
    setParcels(initialParcelsData);
  }, []);

  const filteredParcels = parcels.filter((parcel) => {
    const matchesBuilding = selectedBuilding
      ? parcel.roomNo.startsWith(selectedBuilding)
      : true;
    const matchesSearch = searchQuery
      ? parcel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parcel.trackingNumber.includes(searchQuery)
      : true;
    const matchesStatus = filterStatus ? parcel.status === filterStatus : true;
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
    <div className="min-h-screen p-8 bg-[#EBECE1]">
      <h1 className="text-3xl font-bold text-center mb-8">Parcels Page</h1>

      {/* Filters Section */}
      <div className="p-6 rounded-lg shadow-sm mb-6 bg-[#898F63] text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            className="w-full p-2 rounded bg-white text-black"
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

          <input
            type="text"
            className="w-full p-2 rounded"
            placeholder="Search Room, Parcel number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="w-full p-2 rounded bg-white text-black"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Filter Status</option>
            <option value="haven't collected">Haven't Collected</option>
            <option value="collected">Collected</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className="w-full p-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded"
            onClick={() => setIsAddingParcel(true)}
          >
            Add Parcels
          </button>
          <button
            className="w-full p-2 bg-red-500 hover:bg-red-600 text-white rounded"
            onClick={() => setIsDeleting(true)}
          >
            Delete Parcels
          </button>
        </div>
      </div>

      {/* Add Parcel Form */}
      {isAddingParcel && (
        <div className="p-6 rounded-lg shadow-sm mb-6 bg-white">
          <h4 className="text-xl font-semibold mb-4">Add Parcel</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Room No."
              value={newParcel.roomNo}
              onChange={(e) =>
                setNewParcel({ ...newParcel, roomNo: e.target.value })
              }
            />
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Tenant Name"
              value={newParcel.name}
              onChange={(e) =>
                setNewParcel({ ...newParcel, name: e.target.value })
              }
            />
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Tracking Number"
              value={newParcel.trackingNumber}
              onChange={(e) =>
                setNewParcel({
                  ...newParcel,
                  trackingNumber: e.target.value,
                })
              }
            />
            <select
              className="w-full p-2 border rounded"
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
          <button
            className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
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
        <div className="p-6 rounded-lg shadow-sm mb-6 bg-white">
          <h4 className="text-xl font-semibold mb-4">Edit Parcel</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Room No."
              value={isEditingParcel.roomNo}
              onChange={(e) =>
                setIsEditingParcel({
                  ...isEditingParcel,
                  roomNo: e.target.value,
                })
              }
            />
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Tenant Name"
              value={isEditingParcel.name}
              onChange={(e) =>
                setIsEditingParcel({
                  ...isEditingParcel,
                  name: e.target.value,
                })
              }
            />
            <input
              type="text"
              className="w-full p-2 border rounded"
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
          <button
            className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            onClick={handleSaveEditParcel}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Parcels List */}
      <div className="space-y-4">
        {filteredParcels.map((parcel) => (
          <div
            key={parcel.trackingNumber}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200"
          >
            {isDeleting && (
              <input
                type="checkbox"
                className="mr-4"
                checked={parcel.isSelected || false}
                onChange={() => toggleSelectForDelete(parcel.trackingNumber)}
              />
            )}
            <div className="flex items-center gap-4">
              <svg
                className="w-6 h-6 text-[#898F63]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
              </svg>
              <div>
                <p className="mb-1">Room no. {parcel.roomNo}</p>
                <p className="mb-1">Name: {parcel.name}</p>
                <p className="mb-1">Tracking number: {parcel.trackingNumber}</p>
              </div>
            </div>
            <div>
              {parcel.status === "haven't collected" ? (
                <>
                  <button
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded mr-2"
                    onClick={() => setIsEditingParcel(parcel)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
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
                </>
              ) : (
                <span className="px-3 py-1 bg-green-800 text-white rounded text-sm">
                  Collected
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {isDeleting && (
        <button
          className="fixed top-4 right-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
          onClick={handleDeleteSelected}
        >
          Delete Selected
        </button>
      )}
    </div>
  );
};

export default ParcelsPage;
