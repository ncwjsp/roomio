"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Checkbox,
  FormControlLabel,
  Chip,
  Divider,
} from "@mui/material";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isPast,
  isSameMonth,
  getDate,
} from "date-fns";
import { useSession } from "next-auth/react";

// Create a wrapper component that uses searchParams
function EditScheduleContent() {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [buildingName, setBuildingName] = useState("");
  const [daysWithBookings, setDaysWithBookings] = useState([]);

  useEffect(() => {
    if (!scheduleId) {
      router.push("/cleaning");
      return;
    }

    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/cleaning/schedule?id=${scheduleId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch schedule");
        }

        const data = await response.json();
        setSchedule(data);

        // Make sure to set selectedDays from the existing schedule - use a Set to avoid duplicates
        if (data.selectedDays && Array.isArray(data.selectedDays)) {
          // Remove any duplicate days by using a Set and ensure all values are numbers
          const uniqueDays = [...new Set(data.selectedDays)].map((day) =>
            Number(day)
          );
          setSelectedDays(uniqueDays.sort((a, b) => a - b));
          console.log("Selected Days after load:", uniqueDays);
        }

        // Fetch building details
        if (data.buildingId) {
          const buildingResponse = await fetch(
            `/api/building/${data.buildingId}`
          );
          if (buildingResponse.ok) {
            const buildingData = await buildingResponse.json();
            setBuildingName(buildingData.name || "Unknown Building");
          } else {
            console.error("Failed to fetch building details");
            setBuildingName("Unknown Building");
          }
        }

        // Generate calendar days
        if (data.month) {
          const [year, month] = data.month.split("-");
          const monthDate = new Date(parseInt(year), parseInt(month) - 1);

          const days = eachDayOfInterval({
            start: startOfMonth(monthDate),
            end: endOfMonth(monthDate),
          }).map((date) => ({
            date,
            day: getDate(date),
            isPast: isPast(date),
            isToday: isToday(date),
            inCurrentMonth: isSameMonth(date, monthDate),
          }));

          setCalendarDays(days);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching schedule:", error);
        setSnackbar({
          open: true,
          message: error.message || "Failed to fetch schedule",
          severity: "error",
        });
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId, router]);

  useEffect(() => {
    console.log("Current selectedDays state:", selectedDays);
  }, [selectedDays]);

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
                animationDelay: `${-0.0833 * (12 - i)}s`,
              }}
            />
          ))}
        </div>
        <style jsx>{`
          @keyframes spinner-fade {
            0% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  };

  const handleDaySelect = (day) => {
    setSelectedDays((prev) => {
      // Make sure day is a number
      const numDay = Number(day);

      // Check if the day is already selected
      if (prev.includes(numDay)) {
        // Remove the day
        return prev.filter((d) => d !== numDay);
      } else {
        // Add the day and sort the array
        return [...prev, numDay].sort((a, b) => a - b);
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch("/api/cleaning/schedule", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleId,
          selectedDays,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if the error is about days with booked slots
        if (data.days && Array.isArray(data.days)) {
          setDaysWithBookings(data.days);
          throw new Error(
            `Cannot remove days ${data.days.join(
              ", "
            )} as they have booked slots`
          );
        }
        throw new Error(data.error || "Failed to update schedule");
      }

      setSnackbar({
        open: true,
        message: "Schedule updated successfully",
        severity: "success",
      });

      // Navigate back to cleaning page after short delay
      setTimeout(() => {
        router.push("/cleaning");
      }, 1500);
    } catch (error) {
      console.error("Error updating schedule:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to update schedule",
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <LoadingSpinner />
        </Box>
      </Container>
    );
  }

  if (!schedule) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Schedule not found</Alert>
        <Button
          variant="contained"
          onClick={() => router.push("/cleaning")}
          sx={{ mt: 2, bgcolor: "#898F63", "&:hover": { bgcolor: "#707454" } }}
        >
          Return to Cleaning Management
        </Button>
      </Container>
    );
  }

  // Generate days of the week header
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" color="#898F63" fontWeight={600}>
          Edit Cleaning Schedule
        </Typography>
        <Button
          variant="outlined"
          onClick={() => router.push("/cleaning")}
          sx={{
            color: "#898F63",
            borderColor: "#898F63",
            "&:hover": {
              borderColor: "#707454",
              backgroundColor: "rgba(137, 143, 99, 0.04)",
            },
          }}
        >
          Back to Cleaning Management
        </Button>
      </Box>

      <Card
        sx={{ mb: 4, borderRadius: 2, boxShadow: (theme) => theme.shadows[1] }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={500}>
            Schedule Details
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography color="text.secondary" variant="body2">
                Building
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {buildingName || "Unknown Building"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="text.secondary" variant="body2">
                Month
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {schedule.month
                  ? format(parseISO(`${schedule.month}-01`), "MMMM yyyy")
                  : "Unknown"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="text.secondary" variant="body2">
                Slot Duration
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {Math.floor(schedule.slotDuration / 60)}h{" "}
                {schedule.slotDuration % 60}m
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="text.secondary" variant="body2">
                Time Ranges
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                {schedule.timeRanges?.map((range, index) => (
                  <Chip
                    key={index}
                    label={`${range.start} - ${range.end}`}
                    sx={{ bgcolor: "primary.lighter" }}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card
        sx={{ mb: 4, borderRadius: 2, boxShadow: (theme) => theme.shadows[1] }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={500}>
            Select Cleaning Days
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            Check the days when cleaning should be scheduled. Past dates are
            disabled.
          </Typography>

          <Grid container spacing={1} sx={{ mb: 1 }}>
            {weekDays.map((day) => (
              <Grid item xs={12 / 7} key={day}>
                <Typography
                  align="center"
                  variant="body2"
                  sx={{ fontWeight: 500, color: "text.secondary" }}
                >
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={1}>
            {/* Add empty cells for offset at the start of the month */}
            {calendarDays.length > 0 &&
              [...Array(getDay(calendarDays[0].date))].map((_, index) => (
                <Grid item xs={12 / 7} key={`empty-start-${index}`}>
                  <Box sx={{ p: 2 }}></Box>
                </Grid>
              ))}

            {/* Calendar days */}
            {calendarDays.map((calendarDay) => {
              const isSelected = selectedDays.includes(Number(calendarDay.day));

              return (
                <Grid item xs={12 / 7} key={`day-${calendarDay.day}`}>
                  <Paper
                    elevation={0}
                    onClick={() =>
                      !calendarDay.isPast &&
                      handleDaySelect(Number(calendarDay.day))
                    }
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: daysWithBookings.includes(calendarDay.day)
                        ? "error.main"
                        : isSelected
                        ? "#898F63"
                        : "divider",
                      textAlign: "center",
                      bgcolor: daysWithBookings.includes(calendarDay.day)
                        ? "error.lighter"
                        : isSelected
                        ? "rgba(137, 143, 99, 0.15)"
                        : calendarDay.isPast
                        ? "action.disabledBackground"
                        : "transparent",
                      cursor:
                        calendarDay.isPast ||
                        daysWithBookings.includes(calendarDay.day)
                          ? "default"
                          : "pointer",
                      opacity: calendarDay.isPast ? 0.6 : 1,
                      position: "relative",
                      transition: "all 0.2s",
                      "&:hover":
                        !calendarDay.isPast &&
                        !daysWithBookings.includes(calendarDay.day)
                          ? {
                              bgcolor: isSelected
                                ? "rgba(137, 143, 99, 0.25)"
                                : "action.hover",
                              transform: "translateY(-2px)",
                              boxShadow: 1,
                            }
                          : {},
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight:
                          isSelected ||
                          daysWithBookings.includes(calendarDay.day)
                            ? 600
                            : 400,
                        color: daysWithBookings.includes(calendarDay.day)
                          ? "error.main"
                          : isSelected
                          ? "#898F63"
                          : "text.primary",
                      }}
                    >
                      {calendarDay.day}
                    </Typography>
                    {isSelected && (
                      <Box
                        sx={{
                          position: "absolute",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          bgcolor: "#898F63",
                          bottom: 5,
                          left: "calc(50% - 3px)",
                        }}
                      />
                    )}
                    {calendarDay.isToday && (
                      <Box
                        sx={{
                          position: "absolute",
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          bottom: 5,
                          left: "calc(50% - 2.5px)",
                        }}
                      />
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={500}>
              Selected Days:{" "}
              {selectedDays.length > 0
                ? selectedDays
                    .map((day) => String(day).padStart(2, "0"))
                    .join(", ")
                : "None"}
            </Typography>
            {selectedDays.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No days selected. Please select at least one day.
              </Alert>
            )}
            {daysWithBookings.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Days{" "}
                {daysWithBookings
                  .map((d) => String(d).padStart(2, "0"))
                  .join(", ")}{" "}
                have booked slots and cannot be removed.
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Days with a green dot are currently scheduled. Click on a
              highlighted date to remove it from the schedule.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => router.push("/cleaning")}
          sx={{
            color: "#898F63",
            borderColor: "#898F63",
            "&:hover": {
              borderColor: "#707454",
              backgroundColor: "rgba(137, 143, 99, 0.04)",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={selectedDays.length === 0 || isSaving}
          sx={{
            bgcolor: "#898F63",
            "&:hover": { bgcolor: "#707454" },
            minWidth: "120px",
          }}
        >
          {isSaving ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

// Main component with Suspense boundary
export default function EditSchedulePage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="50vh"
          >
            <CircularProgress sx={{ color: "#898F63" }} />
          </Box>
        </Container>
      }
    >
      <EditScheduleContent />
    </Suspense>
  );
}
