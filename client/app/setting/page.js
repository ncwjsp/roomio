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
    <div>
      <h1>Settings</h1>
      <div>
        <label>
          <span>Electricity Usage (units)</span>
          <input
            type="number"
            value={electricityUsage}
            onChange={(e) => setElectricityUsage(Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          <span>Water Usage (units)</span>
          <input
            type="number"
            value={waterUsage}
            onChange={(e) => setWaterUsage(Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          <span>Building Number</span>
          <input
            type="text"
            value={buildingNumber}
            onChange={(e) => setBuildingNumber(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          <span>Floor Number</span>
          <input
            type="text"
            value={floorNumber}
            onChange={(e) => setFloorNumber(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          <span>Parking Space</span>
          <input
            type="text"
            value={parkingSpace}
            onChange={(e) => setParkingSpace(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          <span>Emergency Contact</span>
          <input
            type="text"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value))}
          />
        </label>
      </div>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default Home;
