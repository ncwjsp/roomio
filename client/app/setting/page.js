"use client";

import Navbar from "@/app/ui/navbar";
import { useState } from "react";

const Home = () => {
  const [electricityUsage, setElectricityUsage] = useState(0);
  const [waterUsage, setWaterUsage] = useState(0);

  const handleSave = () => {
    // Save settings logic here
    console.log("Settings saved:", { electricityUsage, waterUsage });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl mb-4">Settings</h1>
      <div className="mb-4">
        <label className="flex items-center">
          <span className="mr-2">Electricity Usage (units)</span>
          <input
            type="number"
            value={electricityUsage}
            onChange={(e) => setElectricityUsage(Number(e.target.value))}
            className="border p-2"
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
            className="border p-2"
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
  );
};

export default Home;
