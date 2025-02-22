"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab, Box, Typography, CircularProgress } from "@mui/material";
import ApartmentSettings from "./components/ApartmentSettings";
import LiffSettings from "./components/LiffSettings";
import AccountSettings from "./components/AccountSettings";
import PaymentSettings from "./components/PaymentSettings";

// Loading Spinner Component
const LoadingSpinner = () => {
  return (
    <div className="w-16 h-16 inline-block overflow-hidden bg-transparent">
      <div className="w-full h-full relative transform scale-100 origin-[0_0]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute left-[30px] top-[16px] w-[3px] h-[8px] rounded-[2px] bg-[#898f63] origin-[2px_20px]"
            style={{
              transform: `rotate(${i * 30}deg)`,
              animation: `spinner-fade 1s linear infinite`,
              animationDelay: `${-0.0833 * (12 - i)}s`
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes spinner-fade {
          0% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
};

const SettingsPage = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setLoading(true);
    setCurrentTab(newValue);
    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
      setTimeout(() => setLoading(false), 300);
    });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 ">Settings</h1>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
        >
          <Tab label="Apartment" />
          <Tab label="Payment" />
          <Tab label="LINE CONFIG" />
          <Tab label="Account" />
        </Tabs>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "300px",
            width: "100%",
          }}
        >
          <LoadingSpinner />
        </Box>
      ) : (
        <Box sx={{ width: "100%" }}>
          {currentTab === 0 && <ApartmentSettings />}
          {currentTab === 1 && <PaymentSettings />}
          {currentTab === 2 && <LiffSettings />}
          {currentTab === 3 && <AccountSettings />}
        </Box>
      )}
    </div>
  );
};

export default SettingsPage;
