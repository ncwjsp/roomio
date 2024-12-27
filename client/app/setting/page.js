"use client";

import { useState } from "react";

const Home = () => {
  const [electricityUsage, setElectricityUsage] = useState(0);
  const [waterUsage, setWaterUsage] = useState(0);
  const [buildingNumber, setBuildingNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [parkingSpace, setParkingSpace] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const handleSave = () => {
    // Save settings logic here
    console.log("Settings saved:", {
      electricityUsage,
      waterUsage,
      buildingNumber,
      floorNumber,
      parkingSpace,
      emergencyContact,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Settings</h1>
        <div className="mb-4">
          <label className="block text-gray-700">
            <span>Electricity Usage (units)</span>
            <input
              type="number"
              value={electricityUsage}
              onChange={(e) => setElectricityUsage(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">
            <span>Water Usage (units)</span>
            <input
              type="number"
              value={waterUsage}
              onChange={(e) => setWaterUsage(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">
            <span>Building Number</span>
            <select
              value={buildingNumber}
              onChange={(e) => setBuildingNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {[...Array(10).keys()].map((num) => (
                <option key={num + 1} value={num + 1}>
                  {num + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">
            <span>Floor Number</span>
            <select
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {[...Array(20).keys()].map((num) => (
                <option key={num + 1} value={num + 1}>
                  {num + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">
            <span>Parking Space</span>
            <input
              type="text"
              value={parkingSpace}
              onChange={(e) => setParkingSpace(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">
            <span>Emergency Contact</span>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </label>
        </div>
        <button
          onClick={handleSave}
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default Home;
