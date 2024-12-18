"use client";

import React, { useState } from "react";

export default function Parcels() {
  const [parcels, setParcels] = useState([
    { id: 1, roomNo: "101", name: "Nine", trackingNumber: "EX68372657965", collected: false },
    { id: 2, roomNo: "102", name: "John", trackingNumber: "EX68372657966", collected: false },
    { id: 3, roomNo: "103", name: "Alice", trackingNumber: "EX68372657967", collected: true },
    { id: 4, roomNo: "104", name: "Bob", trackingNumber: "EX68372657968", collected: false },
  ]);

  const [selectedParcels, setSelectedParcels] = useState([]);

  const toggleCollected = (id) => {
    setParcels(
      parcels.map((parcel) =>
        parcel.id === id ? { ...parcel, collected: !parcel.collected } : parcel
      )
    );
  };

  const handleSelectParcel = (id) => {
    setSelectedParcels((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((parcelId) => parcelId !== id)
        : [...prevSelected, id]
    );
  };

  const sendReminder = () => {
    selectedParcels.forEach((id) => {
      const parcel = parcels.find((p) => p.id === id);
      alert(`Reminder sent for ${parcel.name} (Room: ${parcel.roomNo})`);
    });
    // Clear selected parcels after sending reminders
    setSelectedParcels([]);
  };

  return (
    <div style={styles.container}>
      {/* Top Section */}
      <div style={styles.topSection}>
        <select style={styles.selectInput}>
          <option>Select Building</option>
          <option>Building A</option>
          <option>Building B</option>
        </select>

        <div style={styles.searchContainer}>
          <input style={styles.searchInput} placeholder="Search Room" />
          <button style={styles.searchButton}>🔍</button>
        </div>

        <button style={styles.uncollectedButton}>Uncollected Items</button>

        <div style={styles.filterContainer}>
          <input style={styles.filterInput} placeholder="Filter" />
          <button style={styles.filterButton}>⚙️</button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.buttonContainer}>
        <button style={styles.buttonEdit}>Edit Parcels</button>
        <button style={styles.buttonAdd}>Add Parcels</button>
        <button style={styles.buttonDelete}>Delete Parcels</button>
        <button style={styles.reminderButton} onClick={sendReminder}>
          Send Reminder
        </button>
      </div>

      {/* Parcel List */}
      {parcels.map((parcel) => (
        <div key={parcel.id} style={styles.parcelItem}>
          <div>
            <input
              type="checkbox"
              checked={selectedParcels.includes(parcel.id)}
              onChange={() => handleSelectParcel(parcel.id)}
            />
            <strong>Room no. {parcel.roomNo}</strong>
            <p>Name: {parcel.name}</p>
            <p>Tracking number: {parcel.trackingNumber}</p>
          </div>
          <div>
            <button
              style={
                parcel.collected ? styles.buttonCollected : styles.buttonUncollected
              }
              onClick={() => toggleCollected(parcel.id)}
            >
              {parcel.collected ? "collected" : "haven't collected"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    backgroundColor: "#F7F7E9",
  },
  topSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "10px",
  },
  selectInput: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    width: "150px",
  },
  searchContainer: {
    display: "flex",
    gap: "5px",
  },
  searchInput: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    width: "150px",
  },
  searchButton: {
    padding: "10px",
    border: "none",
    backgroundColor: "#E79E4F",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
  },
  uncollectedButton: {
    padding: "10px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#ccc",
    cursor: "pointer",
  },
  filterContainer: {
    display: "flex",
    gap: "5px",
  },
  filterInput: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    width: "100px",
  },
  filterButton: {
    padding: "10px",
    backgroundColor: "#ccc",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  buttonEdit: {
    backgroundColor: "#E79E4F",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  buttonAdd: {
    backgroundColor: "#5E6C3F",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  buttonDelete: {
    backgroundColor: "#B64D3D",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  parcelItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: "15px",
    margin: "10px 0",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  buttonCollected: {
    backgroundColor: "#5E6C3F",
    color: "white",
    padding: "5px 10px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
  buttonUncollected: {
    backgroundColor: "#B64D3D",
    color: "white",
    padding: "5px 10px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
  reminderButton: {
    backgroundColor: "#007BFF",
    color: "white",
    padding: "5px 10px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
};
