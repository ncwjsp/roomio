"use client";

import { useState } from "react";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import ApartmentSettings from "./components/ApartmentSettings";
import LiffSettings from "./components/LiffSettings";
import AccountSettings from "./components/AccountSettings";

const SettingsPage = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
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
          <Tab label="LINE LIFF" />
          <Tab label="Account" />
        </Tabs>
      </Box>

      {/* Apartment Settings */}
      {currentTab === 0 && (
        <div role="tabpanel">
          <ApartmentSettings />
        </div>
      )}

      {/* LIFF Settings */}
      {currentTab === 1 && (
        <div role="tabpanel">
          <LiffSettings />
        </div>
      )}

      {/* Account Settings */}
      {currentTab === 2 && (
        <div role="tabpanel">
          <AccountSettings />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
