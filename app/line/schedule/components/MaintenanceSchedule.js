"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  IconButton,
  CircularProgress,
  Paper,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import BuildIcon from "@mui/icons-material/Build";
import RoomIcon from "@mui/icons-material/Room";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export default function MaintenanceSchedule({ lineUserId }) {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (!lineUserId) return;
        
        const response = await fetch(`/api/technician/tasks?lineUserId=${lineUserId}`);
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = await response.json();
        setTasks(data.activeTasks || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
    // Auto select today's date
    const today = format(new Date(), "yyyy-MM-dd");
    setSelectedDate(today);
  }, [lineUserId]);

  const handleMonthChange = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getDaysWithTasks = () => {
    if (!tasks.length) return new Set();

    const days = new Set();
    tasks.forEach(task => {
      if (task.scheduledDate) {
        const dateStr = format(parseISO(task.scheduledDate), "yyyy-MM-dd");
        days.add(dateStr);
      }
    });
    return days;
  };

  const getTasksByDate = (dateStr) => {
    return tasks.filter(task => 
      task.scheduledDate && format(parseISO(task.scheduledDate), "yyyy-MM-dd") === dateStr
    );
  };

  const tileClassName = ({ date, view }) => {
    // Only show styles for the current month
    if (view === 'month' && format(date, "yyyy-MM") !== format(currentMonth, "yyyy-MM")) {
      return "other-month";
    }
    
    const dateStr = format(date, "yyyy-MM-dd");
    return getDaysWithTasks().has(dateStr) ? "has-tasks" : "";
  };

  const tileDisabled = ({ date, view }) => {
    // Disable days not in the current month
    return view === 'month' && format(date, "yyyy-MM") !== format(currentMonth, "yyyy-MM");
  };

  const handleDateChange = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(dateStr);
  };

  if (error) return (
    <Typography component="div" color="error">
      {error}
    </Typography>
  );

  return (
    <Box component="div" sx={{ p: 3 }}>
      <Typography component="h1" variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Maintenance Schedule
      </Typography>

      <Card sx={{ mb: 3, borderRadius: 2, bgcolor: 'white' }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" mb={2}>
            <IconButton onClick={() => handleMonthChange(-1)}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography sx={{ color: '#2c3e50', fontWeight: 500 }}>
              {format(currentMonth, "MMMM yyyy")}
            </Typography>
            <IconButton onClick={() => handleMonthChange(1)}>
              <ChevronRightIcon />
            </IconButton>
          </Stack>

          {isLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: '#898f63' }} />
            </Box>
          ) : (
            <Calendar
              onChange={handleDateChange}
              value={selectedDate ? new Date(selectedDate) : null}
              tileClassName={tileClassName}
              tileDisabled={tileDisabled}
              className="custom-calendar"
              navigationLabel={null}
              navigation={false}
              view="month"
              showNavigation={false}
              activeStartDate={currentMonth}
              formatShortWeekday={(locale, date) => 
                format(date, 'E', { locale })
              }
            />
          )}
        </CardContent>
      </Card>

      {selectedDate && (
        <Paper 
          elevation={0}
          sx={{
            p: 2,
            mt: 2,
            borderRadius: 2,
            bgcolor: '#f8f9fa',
            border: '1px solid #e0e0e0'
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <CalendarTodayIcon sx={{ color: '#898f63', fontSize: 20 }} />
            <Typography sx={{ color: '#2c3e50', fontWeight: 500 }}>
              {format(new Date(selectedDate), "MMMM d, yyyy")}
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            {getTasksByDate(selectedDate).map((task, index) => (
              <Grid item xs={12} sm={6} md={4} key={task._id}>
                <Card
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'white',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      bgcolor: '#f8f9fa'
                    }
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <BuildIcon sx={{ color: '#898f63', fontSize: 18, mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 500, mb: 0.5 }}>
                          {task.problem}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <RoomIcon sx={{ color: '#898f63', fontSize: 16 }} />
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {task.room?.floor?.building?.name} - Floor {task.room?.floor?.floorNumber}, Room {task.room?.roomNumber}
                      </Typography>
                    </Stack>

                  </Stack>
                </Card>
              </Grid>
            ))}
            {getTasksByDate(selectedDate).length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" color="text.secondary" py={2}>
                  No tasks scheduled for this date
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      <style jsx global>{`
        .custom-calendar {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          border: none !important;
          background: none !important;
          padding: 1rem;
        }
        .react-calendar__tile {
          padding: 1em 0.5em;
          position: relative;
        }
        .has-tasks {
          background-color: #e8ecdb !important;
          color: #2c3e50 !important;
          font-weight: 500 !important;
        }
        .has-tasks:hover {
          background-color: #dce1cc !important;
        }
        .other-month {
          color: #ccc !important;
        }
        .react-calendar__tile--active {
          background: #898f63 !important;
          color: white !important;
        }
        .react-calendar__tile--active:hover {
          background: #777b54 !important;
        }
        .react-calendar__month-view__weekdays__weekday {
          color: #64748b;
          font-weight: 500;
          text-decoration: none;
        }
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }
      `}</style>
    </Box>
  );
}
