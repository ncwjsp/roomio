"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab, Box, Typography, CircularProgress } from "@mui/material";
import ApartmentSettings from "./components/ApartmentSettings";
import LiffSettings from "./components/LiffSettings";
import AccountSettings from "./components/AccountSettings";
import PaymentSettings from "./components/PaymentSettings";

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
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

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
          <CircularProgress />
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
