"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import WarningIcon from "@mui/icons-material/Warning";  

export default function MaintenanceSchedule({ lineUserId, assignedBuildings }) {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (!lineUserId) return;
        
        const response = await fetch(`/api/technician/tasks?lineUserId=${lineUserId}`);
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = await response.json();
        setTasks(data.activeTasks || []); // Use activeTasks from response
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [lineUserId]);

  const getDaysWithTasks = () => {
    if (!tasks.length) return new Set();

    const days = new Set();
    tasks.forEach(task => {
      const dateStr = format(parseISO(task.createdAt), "yyyy-MM-dd"); // Use createdAt for date
      days.add(dateStr);
    });
    return days;
  };

  const getTasksByDate = (dateStr) => {
    return tasks.filter(task => 
      format(parseISO(task.createdAt), "yyyy-MM-dd") === dateStr // Use createdAt for date
    );
  };

  const tileClassName = ({ date }) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return getDaysWithTasks().has(dateStr) ? "has-tasks" : "";
  };

  const handleDateChange = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  if (!assignedBuildings?.length) {
    return (
      <Paper 
        elevation={0} 
        className="border border-orange-200 bg-orange-50 p-4 rounded-lg"
      >
        <div className="flex items-center gap-2 mb-2">
          <WarningIcon className="text-orange-500" />
          <Typography variant="subtitle1" className="font-medium text-orange-700">
            No Buildings Assigned
          </Typography>
        </div>
        <Typography className="text-orange-600">
          You have not been assigned to any buildings yet. Please contact your administrator to get your building assignments.
        </Typography>
      </Paper>
    );
  }

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ color: "#1976d2", fontWeight: 600 }}>
        Maintenance Schedule
      </Typography>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Calendar
            onChange={handleDateChange}
            tileClassName={tileClassName}
            className="custom-calendar"
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Tasks for {format(parseISO(selectedDate), "MMMM d, yyyy")}
          </Typography>
          <Grid container spacing={2}>
            {getTasksByDate(selectedDate).map((task, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label={task.room.building.name}
                      size="small"
                      sx={{
                        bgcolor: "#1976d2",
                        color: "white",
                        mb: 1
                      }}
                    />
                  </Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Floor {task.room.floor.floorNumber}, Room {task.room.roomNumber}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {task.description}
                  </Typography>
                  <Chip
                    label={task.currentStatus}
                    size="small"
                    sx={{
                      mt: 1,
                      bgcolor: task.currentStatus === 'Completed' ? 'success.main' : 
                              task.currentStatus === 'Cancelled' ? 'error.main' : 
                              'warning.main',
                      color: 'white'
                    }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <style jsx global>{`
        .custom-calendar {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          border: none !important;
          background: none !important;
        }
        .has-tasks {
          background-color: #1976d2 !important;
          color: white !important;
        }
        .has-tasks:hover {
          background-color: #1565c0 !important;
        }
      `}</style>
    </Box>
  );
}
