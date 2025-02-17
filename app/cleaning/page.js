"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
  Button,
  useTheme,
} from "@mui/material";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, Add as AddIcon } from "@mui/icons-material";

// Add this helper function to get the first day offset
const getMonthStartOffset = (date) => {
  return startOfMonth(date).getDay();
};

export default function CleaningManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const theme = useTheme();

  // Remove the URL params effect and use session instead
  useEffect(() => {
    const fetchBuildings = async () => {
      if (status !== "authenticated" || !session?.user?.id) return;

      setIsLoadingBuildings(true);
      try {
        const response = await fetch(`/api/buildings?id=${session.user.id}`);
        if (!response.ok) throw new Error("Failed to fetch buildings");
        const data = await response.json();
        setBuildings(data.buildings);
      } catch (error) {
        console.error("Error fetching buildings:", error);
        setError(error.message);
      } finally {
        setIsLoadingBuildings(false);
      }
    };

    fetchBuildings();
  }, [session?.user?.id, status]);

  // Update schedules fetch to use session
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!selectedBuilding || status !== "authenticated" || !session?.user?.id)
        return;

      setIsLoadingSchedules(true);
      try {
        const response = await fetch(
          `/api/cleaning/schedules?buildingId=${selectedBuilding}&landlordId=${session.user.id}`
        );
        if (!response.ok) throw new Error("Failed to fetch schedules");
        const data = await response.json();
        console.log("Fetched schedules:", data.schedules);
        setSchedules(data.schedules);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setError(error.message);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [selectedBuilding, session?.user?.id, status]);

  if (status === "loading") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor={theme.palette.grey[100]}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Add unauthorized state
  if (status === "unauthenticated") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor={theme.palette.grey[100]}
      >
        <Typography color="error">
          Please sign in to access this page
        </Typography>
      </Box>
    );
  }

  const handleBuildingChange = (event) => {
    setSelectedBuilding(event.target.value);
  };

  const handleMonthChange = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getCurrentMonthSchedule = () => {
    const currentMonthStr = format(currentMonth, "yyyy-MM");

    const schedule = schedules.find(
      (schedule) => schedule.month === currentMonthStr
    );

    return schedule;
  };

  const getDaysWithSlots = () => {
    const schedule = getCurrentMonthSchedule();
    if (!schedule) return new Set();

    const days = new Set(
      schedule.slots.map((slot) => {
        const dateStr = format(parseISO(slot.date), "yyyy-MM-dd");

        return dateStr;
      })
    );

    return days;
  };

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor={theme.palette.grey[100]}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" py={3}>
      <Container maxWidth="lg">
        {/* Header with Title and Add Button */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" color="text.primary" fontWeight={500}>
            Cleaning Schedule
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/cleaning/add")}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
            }}
          >
            Add Schedule
          </Button>
        </Box>

        {/* Building Selection */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: theme.shadows[1] }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              Select Building
            </Typography>
            {isLoadingBuildings ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Building</InputLabel>
                <Select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  label="Building"
                  sx={{ borderRadius: 1 }}
                >
                  {buildings.map((building) => (
                    <MenuItem key={building._id} value={building._id}>
                      {building.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </CardContent>
        </Card>

        {selectedBuilding && (
          <>
            {/* Calendar View */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={3}
                >
                  <Button
                    onClick={() => handleMonthChange(-1)}
                    startIcon={<ChevronLeft />}
                  >
                    Previous
                  </Button>
                  <Typography variant="h6">
                    {format(currentMonth, "MMMM yyyy")}
                  </Typography>
                  <Button
                    onClick={() => handleMonthChange(1)}
                    endIcon={<ChevronRight />}
                  >
                    Next
                  </Button>
                </Box>

                {isLoadingSchedules ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box>
                    {/* Calendar Grid */}
                    <Grid container spacing={1}>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <Grid item xs={12 / 7} key={day}>
                            <Typography
                              align="center"
                              variant="body2"
                              sx={{ fontWeight: 500, mb: 1 }}
                            >
                              {day}
                            </Typography>
                          </Grid>
                        )
                      )}
                    </Grid>

                    {/* Calendar Days */}
                    <Grid container spacing={1}>
                      {/* Add empty cells for offset */}
                      {[...Array(getMonthStartOffset(currentMonth))].map(
                        (_, index) => (
                          <Grid item xs={12 / 7} key={`empty-${index}`}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1,
                                visibility: "hidden",
                              }}
                            >
                              <Typography>1</Typography>
                            </Paper>
                          </Grid>
                        )
                      )}

                      {/* Calendar days */}
                      {eachDayOfInterval({
                        start: startOfMonth(currentMonth),
                        end: endOfMonth(currentMonth),
                      }).map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const hasSlots = getDaysWithSlots().has(dateStr);

                        return (
                          <Grid item xs={12 / 7} key={dateStr}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1,
                                border: 1,
                                borderColor: hasSlots
                                  ? "primary.main"
                                  : "divider",
                                textAlign: "center",
                                bgcolor: hasSlots
                                  ? "primary.lighter"
                                  : "transparent",
                              }}
                            >
                              <Typography>{format(day, "d")}</Typography>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[1] }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={500}>
                  Booking Details
                </Typography>
                {isLoadingSchedules ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : getCurrentMonthSchedule()?.slots?.length > 0 ? (
                  getCurrentMonthSchedule()?.slots.map((slot) => (
                    <Paper
                      key={slot._id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        mb: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        "&:last-child": { mb: 0 },
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: "rgba(0, 0, 0, 0.01)",
                        },
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Typography
                            color="text.secondary"
                            variant="body2"
                            gutterBottom
                          >
                            Date
                          </Typography>
                          <Typography fontWeight={500}>
                            {format(parseISO(slot.date), "MMM d, yyyy")}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography
                            color="text.secondary"
                            variant="body2"
                            gutterBottom
                          >
                            Time
                          </Typography>
                          <Typography fontWeight={500}>
                            {slot.fromTime} - {slot.toTime}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            color="text.secondary"
                            variant="body2"
                            gutterBottom
                          >
                            Status
                          </Typography>
                          {slot.bookedBy &&
                          slot.bookedBy !== null &&
                          slot.bookedBy !== "null" ? (
                            <Box>
                              <Typography color="warning.main" fontWeight={500}>
                                Booked by Room {slot.bookedBy.room?.roomNumber}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Tenant: {slot.bookedBy.name}
                              </Typography>
                              {slot.bookedAt && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Booked at:{" "}
                                  {format(
                                    parseISO(slot.bookedAt),
                                    "MMM d, yyyy HH:mm"
                                  )}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography color="success.main" fontWeight={500}>
                              Available
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                ) : (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    py={6}
                    px={3}
                  >
                    <Typography
                      color="text.secondary"
                      align="center"
                      gutterBottom
                    >
                      No cleaning schedules found for this month
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => router.push("/cleaning/add")}
                      sx={{ mt: 2, textTransform: "none" }}
                    >
                      Add New Schedule
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
}
