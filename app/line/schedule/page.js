"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import HousekeeperSchedule from "./components/HousekeeperSchedule";
import MaintenanceSchedule from "./components/MaintenanceSchedule";

export default function SchedulePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lineUserId, setLineUserId] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [assignedBuildings, setAssignedBuildings] = useState([]);

  useEffect(() => {
    const fetchStaffRole = async () => {
      if (!lineUserId) return;
      
      try {
        const response = await fetch(`/api/staff/role?lineUserId=${lineUserId}`);
        if (!response.ok) throw new Error("Failed to fetch staff role");
        const data = await response.json();
        setStaffRole(data.role);

        // If this is a housekeeper, fetch their buildings right away
        if (data.role === "Housekeeper") {
          try {
            const buildingsResponse = await fetch(`/api/housekeeper/buildings?lineUserId=${lineUserId}`);
            if (!buildingsResponse.ok) throw new Error("Failed to fetch assigned buildings");
            const buildingsData = await buildingsResponse.json();
            setAssignedBuildings(buildingsData.buildings || []);
          } catch (error) {
            console.error("Error fetching buildings:", error);
            setError(error.message);
          }
        }
      } catch (error) {
        console.error("Error fetching staff info:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffRole();
  }, [lineUserId]);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const { searchParams } = new URL(window.location.href);
        const id = searchParams.get("id");

        if (!id) {
          throw new Error("ID not provided in URL");
        }

        // Get LIFF ID from line-config
        const response = await fetch(`/api/user/line-config?id=${id}`);
        const data = await response.json();

        if (!data.lineConfig?.liffIds?.schedule) {
          throw new Error("LIFF ID not configured for schedule feature");
        }

        const liff = (await import("@line/liff")).default;
        await liff.init({
          liffId: data.lineConfig.liffIds.schedule,
        });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
      } catch (error) {
        console.error("Failed to initialize LIFF:", error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    initializeLiff();
  }, []);

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Show loading spinner for initial load
  if (isLoading || staffRole === "") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#889F63' }} />
      </Box>
    );
  }

  return (
    <Suspense fallback={<CircularProgress />}>
      {staffRole === "Housekeeper" ? (
        <HousekeeperSchedule 
          lineUserId={lineUserId} 
          assignedBuildings={assignedBuildings} 
        />
      ) : staffRole === "Technician" ? (
        <MaintenanceSchedule 
          lineUserId={lineUserId} 
          assignedBuildings={assignedBuildings}
        />
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Typography>Invalid staff role</Typography>
        </Box>
      )}
    </Suspense>
  );
}
