"use client";

import Navbar from "@/app/ui/navbar";
import { useState } from "react";

const Home = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    // Save settings logic here
    console.log("Settings saved:", { darkMode, notifications });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl mb-4">Settings</h1>
      <div className="mb-4">
        <label className="flex items-center">
          <span className="mr-2">Dark Mode</span>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
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
