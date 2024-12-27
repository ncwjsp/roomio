"use client";

import Navbar from "@/app/ui/navbar";
import { useState } from "react";

const Home = () => {
  const [electricityUnit, setElectricityUnit] = useState("kWh");
  const [waterUnit, setWaterUnit] = useState("liters");

  const handleSave = () => {
    // Save settings logic here
    console.log("Settings saved:", { electricityUnit, waterUnit });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl mb-4">Settings</h1>
      <div className="mb-4">
        <label className="flex items-center">
          <span className="mr-2">Electricity Unit</span>
          <select
            value={electricityUnit}
            onChange={(e) => setElectricityUnit(e.target.value)}
          >
            <option value="kWh">kWh</option>
            <option value="MWh">MWh</option>
          </select>
        </label>
      </div>
      <div className="mb-4">
        <label className="flex items-center">
          <span className="mr-2">Water Unit</span>
          <select
            value={waterUnit}
            onChange={(e) => setWaterUnit(e.target.value)}
          >
            <option value="liters">Liters</option>
            <option value="gallons">Gallons</option>
          </select>
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
