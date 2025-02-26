"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
} from "@mui/material";
import HousekeeperTasks from "./components/HousekeeperTasks";
import MaintenanceTasks from "./components/MaintenanceTasks";

export default function TasksPage() {
  const [activeTasks, setActiveTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(true);
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
          setIsBuildingsLoading(true);
          try {
            const buildingsResponse = await fetch(`/api/housekeeper/buildings?lineUserId=${lineUserId}`);
            if (!buildingsResponse.ok) throw new Error("Failed to fetch assigned buildings");
            const buildingsData = await buildingsResponse.json();
            setAssignedBuildings(buildingsData.buildings || []);
          } catch (error) {
            console.error("Error fetching buildings:", error);
            setError(error.message);
          } finally {
            setIsBuildingsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching staff info:", error);
        setError(error.message);
      }
    };

    fetchStaffRole();
  }, [lineUserId]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!lineUserId || !staffRole) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Staff role:', staffRole);
        console.log('Line user ID:', lineUserId);
        
        const endpoint = staffRole === "Technician" 
          ? `/api/technician/tasks?lineUserId=${lineUserId}`
          : `/api/housekeeper/tasks?lineUserId=${lineUserId}`;
          
        console.log('Fetching from:', endpoint);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          throw new Error(errorData.error || "Failed to fetch tasks");
        }
        
        const data = await response.json();
        console.log('Received data:', JSON.stringify(data, null, 2));
        
        if (!data.activeTasks?.length && !data.completedTasks?.length) {
          console.log('No tasks found. Staff:', staffRole, 'Line ID:', lineUserId);
        }
        
        setActiveTasks(data.activeTasks || []);
        setCompletedTasks(data.completedTasks || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [lineUserId, staffRole, isBuildingsLoading, assignedBuildings.length]);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const { searchParams } = new URL(window.location.href);
        const id = searchParams.get("id");

        if (!id) {
          throw new Error("ID not provided in URL");
        }

        const response = await fetch(`/api/user/line-config?id=${id}`);
        const data = await response.json();

        if (!data.lineConfig?.liffIds?.tasks) {
          throw new Error("LIFF ID not configured for tasks feature");
        }

        const liff = (await import("@line/liff")).default;
        await liff.init({
          liffId: data.lineConfig.liffIds.tasks,
        });

        if (!liff.isLoggedIn()) {
          await liff.login();
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

  // Show loading spinner for initial load
  if (staffRole === "" || (staffRole === "Housekeeper" && isBuildingsLoading)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#889F63' }} />
      </Box>
    );
  }

  const handleUpdateTask = async (taskId, status, comment) => {
    try {
      setIsLoading(true);
      const endpoint = staffRole === "Technician" 
        ? "/api/technician/tasks"
        : "/api/housekeeper/tasks";
        
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: taskId,
          status,
          comment,
          lineUserId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to update task");
      }

      const { task } = await response.json();
      
      // Update the tasks lists
      if (status === "completed" || status === "cancelled") {
        setActiveTasks(activeTasks.filter(t => t._id !== taskId));
        setCompletedTasks([task, ...completedTasks]);
      } else {
        setActiveTasks(activeTasks.map(t => t._id === taskId ? task : t));
      }
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 7 }}>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {staffRole === "Technician" ? "Maintenance Tasks" : "Cleaning Tasks"}
          </Typography>
          
          {staffRole === "Technician" ? (
            <MaintenanceTasks
              activeTasks={activeTasks}
              completedTasks={completedTasks}
              onUpdateTask={handleUpdateTask}
            />
          ) : (
            <HousekeeperTasks
              activeTasks={activeTasks}
              completedTasks={completedTasks}
              onUpdateTask={handleUpdateTask}
              assignedBuildings={assignedBuildings}
              isLoading={isLoading || isBuildingsLoading}
            />
          )}
        </Box>
      </Container>
    </Box>
  );
}
