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
  IconButton,
  CircularProgress,
  Badge,
  Stack,
  Divider,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import WarningIcon from "@mui/icons-material/Warning";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HomeIcon from "@mui/icons-material/Home";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export default function HousekeeperSchedule({ lineUserId, assignedBuildings }) {
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setIsLoading(true);
        const monthStr = format(currentMonth, "yyyy-MM");
        console.log("Fetching schedules for lineUserId:", lineUserId, "month:", monthStr);
        
        const response = await fetch(
          `/api/cleaning/schedules?lineUserId=${lineUserId}&month=${monthStr}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch schedules");
        }

        const data = await response.json();
        console.log("Raw API Response:", {
          schedules: data.schedules?.map(s => ({
            building: s.buildingId?.name,
            slots: s.slots?.map(slot => ({
              date: slot.date,
              time: `${slot.fromTime}-${slot.toTime}`,
              tenant: slot.bookedBy?.name,
              room: slot.bookedBy?.room?.roomNumber,
              raw: slot // Log the raw slot data
            }))
          }))
        });

        const formattedSchedules = data.schedules?.map(schedule => ({
          ...schedule,
          buildingName: schedule.buildingName,
          slots: schedule.slots?.map(slot => ({
            ...slot,
            buildingName: schedule.buildingName,
            roomNumber: slot.bookedBy?.room?.roomNumber
          })) || []
        }));
        
        console.log("Formatted Schedules:", formattedSchedules); // Debug log
        setSchedules(formattedSchedules || []);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (lineUserId && assignedBuildings?.length) {
      const month = format(currentMonth, "yyyy-MM");
      fetchSchedules();
      // Auto select today's date
      const today = format(new Date(), "yyyy-MM-dd");
      setSelectedDate(today);
    }
  }, [lineUserId, assignedBuildings, currentMonth]);

  const handleMonthChange = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
    // Reset selected date when changing months
    setSelectedDate(null);
  };

  const getDaysWithSlots = () => {
    if (!schedules.length) {
      console.log("No schedules found");
      return new Set();
    }

    const days = new Set();
    schedules.forEach(schedule => {
      if (!schedule.selectedDays?.length) {
        console.log("No selected days in schedule for building:", schedule.buildingName);
        return;
      }
      
      schedule.selectedDays.forEach(day => {
        // Day is already in format "1", "2", etc.
        const dateStr = format(new Date(schedule.month + '-' + day.padStart(2, '0')), "yyyy-MM-dd");
        days.add(dateStr);
      });
    });
    
    return days;
  };

  const getSlotsByDate = (dateStr) => {
    const slots = [];
    schedules.forEach(schedule => {
      if (!schedule.slots?.length) {
        return;
      }
      
      schedule.slots.forEach(slot => {
        if (!slot.date) return;
        
        const slotDate = format(new Date(slot.date), "yyyy-MM-dd");
        if (slotDate === dateStr) {
          slots.push({
            ...slot,
            buildingName: schedule.buildingId?.name || 'Unknown Building',
            roomNumber: slot.bookedBy?.room?.roomNumber,
            isAvailable: !slot.bookedBy
          });
        }
      });
    });
    
    // Sort slots to show booked ones first
    return slots.sort((a, b) => {
      if (a.isAvailable === b.isAvailable) {
        return 0;
      }
      return a.isAvailable ? 1 : -1;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case 'cancelled':
        return <CancelIcon sx={{ color: '#f44336' }} />;
      default:
        return <PendingIcon sx={{ color: '#ff9800' }} />;
    }
  };

  const tileClassName = ({ date, view }) => {
    // Only show styles for the current month
    if (view === 'month' && format(date, "yyyy-MM") !== format(currentMonth, "yyyy-MM")) {
      return "other-month";
    }
    
    const dateStr = format(date, "yyyy-MM-dd");
    const hasSlots = getDaysWithSlots().has(dateStr);
    return hasSlots ? "has-slots" : "";
  };

  const tileDisabled = ({ date, view }) => {
    // Disable days not in the current month
    return view === 'month' && format(date, "yyyy-MM") !== format(currentMonth, "yyyy-MM");
  };

  const handleDateChange = (date) => {
    // Only allow selecting dates in the current month
    if (format(date, "yyyy-MM") === format(currentMonth, "yyyy-MM")) {
      const dateStr = format(date, "yyyy-MM-dd");
      setSelectedDate(selectedDate === dateStr ? null : dateStr);
    }
  };

  if (!assignedBuildings?.length) {
    return (
      <Paper 
        elevation={0} 
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: '#fff3e0',
          border: '1px solid #ffe0b2'
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <WarningIcon sx={{ color: '#f57c00' }} />
          <Typography variant="h6" sx={{ color: '#e65100', fontWeight: 600 }}>
            No Buildings Assigned
          </Typography>
        </Stack>
        <Typography sx={{ color: '#e65100' }}>
          You have not been assigned to any buildings yet. Please contact your administrator to get your building assignments.
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper 
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: '#ffebee',
          border: '1px solid #ffcdd2'
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <WarningIcon sx={{ color: '#d32f2f' }} />
          <Typography variant="h6" sx={{ color: '#c62828', fontWeight: 600 }}>
            Error Loading Schedule
          </Typography>
        </Stack>
        <Typography sx={{ color: '#c62828' }}>
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
  
        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
          <Typography variant="h5" sx={{ color: '#898f63', fontWeight: 600 }}>
            Cleaning Schedule
          </Typography>
        </Stack>

        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            bgcolor: 'white'
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mb={3}>
              <IconButton 
                onClick={() => handleMonthChange(-1)}
                sx={{ 
                  color: '#898f63',
                  '&:hover': {
                    bgcolor: '#f1f3e6'
                  }
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                {format(currentMonth, "MMMM yyyy")}
              </Typography>
              <IconButton 
                onClick={() => handleMonthChange(1)}
                sx={{ 
                  color: '#898f63',
                  '&:hover': {
                    bgcolor: '#f1f3e6'
                  }
                }}
              >
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
            mt: 4,
            mb: 2,
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
            {getSlotsByDate(selectedDate).map((slot, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
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
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <HomeIcon sx={{ color: '#898f63', fontSize: 18, mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 500, mb: 0.5 }}>
                        {slot.buildingName} {slot.bookedBy?.room?.roomNumber ? 
                          `- Room ${slot.bookedBy.room.roomNumber}` : 
                          '- Available'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack 
                    direction="row" 
                    spacing={1} 
                    alignItems="center"
                    sx={{ 
                      p: 0.75,
                      mt: 1,
                      borderRadius: 1,
                      bgcolor: '#f8f9fa'
                    }}
                  >
                    <AccessTimeIcon sx={{ color: '#898f63', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {slot.fromTime} - {slot.toTime}
                    </Typography>
                  </Stack>
                </Card>
              </Grid>
            ))}
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
        .custom-calendar .react-calendar__navigation {
          display: none !important;
        }
        .custom-calendar .react-calendar__tile {
          padding: 1em 0.5em;
          border-radius: 8px;
          font-weight: 500;
        }
        .custom-calendar .react-calendar__month-view__days__day--weekend {
          color: #f44336;
        }
        .custom-calendar .react-calendar__tile:enabled:hover,
        .custom-calendar .react-calendar__tile:enabled:focus {
          background-color: #f1f3e6;
          border-radius: 8px;
        }
        .custom-calendar .react-calendar__tile--now {
          background: #fff3e0;
          border-radius: 8px;
        }
        .custom-calendar .react-calendar__tile--active {
          background: #898f63 !important;
          border-radius: 8px;
          color: white !important;
        }
        .custom-calendar .has-slots {
          background-color: #e8ecd3;
          color: #898f63;
          font-weight: bold;
        }
        .custom-calendar .has-slots:hover {
          background-color: #dce0c7;
        }
        .custom-calendar .react-calendar__navigation button:enabled:hover,
        .custom-calendar .react-calendar__navigation button:enabled:focus {
          background-color: #f1f3e6;
          border-radius: 8px;
        }
        .custom-calendar .react-calendar__navigation button[disabled] {
          background-color: #f8f9fa;
        }
        .custom-calendar .other-month {
          color: #bdbdbd !important;
          background-color: #f5f5f5 !important;
          cursor: not-allowed !important;
        }
        .custom-calendar .other-month:hover {
          background-color: #f5f5f5 !important;
        }
      `}</style>
    </Box>
  );
}
