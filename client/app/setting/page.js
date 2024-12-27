"use client";

import Navbar from "@/app/ui/navbar";
import { useState } from "react";

const Home = () => {
  const [electricityUsage, setElectricityUsage] = useState(0);
  const [waterUsage, setWaterUsage] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    // Save settings logic here
    console.log("Settings saved:", { electricityUsage, waterUsage, darkMode, notifications });
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
      <Navbar />
      <div className="flex flex-col items-center justify-center p-4">
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <h1 className="text-2xl mb-4">Settings</h1>
          <div className="mb-4">
            <label className="flex items-center">
              <span className="mr-2">Electricity Usage (units)</span>
              <input
                type="number"
                value={electricityUsage}
                onChange={(e) => setElectricityUsage(Number(e.target.value))}
                className="border p-2 rounded"
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <span className="mr-2">Water Usage (units)</span>
              <input
                type="number"
                value={waterUsage}
                onChange={(e) => setWaterUsage(Number(e.target.value))}
                className="border p-2 rounded"
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <span className="mr-2">Dark Mode</span>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                className="ml-2"
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <span className="mr-2">Notifications</span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
                className="ml-2"
              />
            </label>
          </div>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
