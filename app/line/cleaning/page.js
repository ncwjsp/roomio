"use client";
import { useState, useEffect, Suspense } from "react";
import {
  parseISO,
  format,
  addMonths,
  isBefore,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
  isAfter,
  endOfDay,
  addHours,
} from "date-fns";
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import Loading from "../components/loading";

export default function CleaningBookingPage() {
  const [userId, setUserId] = useState("");
  const [schedules, setSchedules] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [landlordId, setLandlordId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [tenantDetails, setTenantDetails] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const theme = useTheme();

  // Thailand is UTC+7
  const TIMEZONE_OFFSET = 7;

  // Convert UTC dates to local timezone
  const toLocalDate = (date) => {
    if (typeof date === "string") {
      date = parseISO(date);
    }
    return addHours(date, TIMEZONE_OFFSET);
  };

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

        if (!data.lineConfig?.liffIds?.cleaning) {
          throw new Error("LIFF ID not configured for cleaning feature");
        }

        const liff = (await import("@line/liff")).default;
        await liff.init({
          liffId: data.lineConfig.liffIds.cleaning,
        });

        if (!liff.isLoggedIn()) {
          await liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setUserId(profile.userId);
        setLandlordId(id);

        // Fetch tenant details first
        const tenantResponse = await fetch(
          `/api/tenant/details?lineUserId=${profile.userId}&landlordId=${id}`
        );
        if (!tenantResponse.ok)
          throw new Error("Failed to fetch tenant details");
        const tenantData = await tenantResponse.json();
        setTenantDetails(tenantData.tenant);

        // Then fetch cleaning schedules using the building ID
        const schedulesResponse = await fetch(
          `/api/cleaning/available?lineUserId=${profile.userId}&landlordId=${id}&buildingId=${tenantData.tenant.room.buildingId}`
        );
        if (!schedulesResponse.ok)
          throw new Error("Failed to fetch cleaning schedules");
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData.schedules);
      } catch (error) {
        console.error("Failed to initialize LIFF:", error);
        setError("Failed to initialize LINE login");
      } finally {
        setIsLoading(false);
      }
    };

    initializeLiff();
  }, []); // Run once on component mount

  const handlePreviousMonth = () => {
    if (!schedules) return;
    const prevMonth = addMonths(currentMonth, -1);
    if (
      !isBefore(prevMonth, startOfMonth(new Date())) &&
      schedules.some(
        (schedule) => schedule.month === format(prevMonth, "yyyy-MM")
      )
    ) {
      setCurrentMonth(prevMonth);
    }
  };

  // Get the last month that has a schedule
  const getLastScheduledMonth = () => {
    if (!schedules.length) return new Date();
    // Sort schedules by month to ensure we get the latest one
    const sortedSchedules = [...schedules].sort((a, b) =>
      b.month.localeCompare(a.month)
    );
    const lastSchedule = sortedSchedules[0];
    return parseISO(lastSchedule.month + "-01");
  };

  const handleNextMonth = () => {
    if (!schedules) return;
    const nextMonth = addMonths(currentMonth, 1);
    const hasSchedule = schedules.some(
      (schedule) => schedule.month === format(nextMonth, "yyyy-MM")
    );

    if (hasSchedule) {
      setCurrentMonth(nextMonth);
    }
  };

  // Check if a day is in the past
  const isDayInPast = (date) => {
    return isBefore(endOfDay(date), new Date());
  };

  // Check if a specific time is in the past
  const isTimeInPast = (date, timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hours, minutes, 0, 0);
    return isBefore(slotTime, new Date());
  };

  // Get days with slots
  const getDaysWithSlots = () => {
    if (!schedules) return new Set();
    const monthSchedule = schedules.find(
      (schedule) => schedule.month === format(currentMonth, "yyyy-MM")
    );

    if (!monthSchedule) return new Set();

    return new Set(
      monthSchedule.slots
        .filter((slot) => {
          const slotDate = new Date(slot.date);
          if (isToday(slotDate)) {
            return !slot.bookedBy && !isTimeInPast(slotDate, slot.fromTime);
          }
          return !slot.bookedBy;
        })
        .map((slot) => format(new Date(slot.date), "yyyy-MM-dd"))
    );
  };

  // Get slots for selected date
  const getSlotsForDate = (date) => {
    if (!schedules) return [];
    const monthSchedule = schedules.find(
      (schedule) => schedule.month === format(date, "yyyy-MM")
    );

    if (!monthSchedule) return [];

    return monthSchedule.slots
      .filter((slot) => {
        const slotDate = new Date(slot.date);
        if (format(slotDate, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd"))
          return false;

        if (isToday(slotDate)) {
          return !slot.bookedBy && !isTimeInPast(slotDate, slot.fromTime);
        }
        return !slot.bookedBy && !isDayInPast(slotDate);
      })
      .map((slot) => ({
        ...slot,
        scheduleId: monthSchedule._id,
        date: new Date(slot.date),
      }))
      .sort((a, b) => a.fromTime.localeCompare(b.fromTime));
  };

  const handleBookSlot = async (scheduleId, slot) => {
    setSelectedSlot({
      ...slot,
      scheduleId, // Make sure scheduleId is included
    });
    setShowConfirmModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || isBooking) return;

    setIsBooking(true);
    setBookingError(null);

    try {
      const response = await fetch("/api/cleaning/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: selectedSlot._id,
          scheduleId: selectedSlot.scheduleId,
          lineUserId: userId,
          landlordId: landlordId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to book slot");
      }

      // Update local state to reflect the booking
      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) => {
          if (schedule._id === selectedSlot.scheduleId) {
            return {
              ...schedule,
              slots: schedule.slots.map((slot) =>
                slot._id === selectedSlot._id
                  ? { ...slot, bookedBy: userId, bookedAt: new Date() }
                  : slot
              ),
            };
          }
          return schedule;
        })
      );

      // Show success message
      alert("Booking successful!");
      setShowConfirmModal(false);
      setSelectedDate(null);
    } catch (error) {
      setBookingError(error.message);
    } finally {
      setIsBooking(false);
    }
  };

  // Helper function to get the day of week index (0 = Sunday, 6 = Saturday)
  const getDayOfWeek = (date) => {
    // Get the day of week (0-6), adjusting for Thailand's week start
    return date.getDay();
  };

  // Add this helper function to get the first day offset
  const getMonthStartOffset = (date) => {
    const startOfMonthDay = startOfMonth(date).getDay();
    return startOfMonthDay;
  };

  // Add console logs to debug schedules
  console.log("Current schedules:", schedules?.map(s => ({
    month: s.month,
    slots: s.slots?.length || 0,
    selectedDays: s.selectedDays
  })));
  console.log("Current month:", format(currentMonth, "yyyy-MM"));
  console.log("Next month:", format(addMonths(currentMonth, 1), "yyyy-MM"));
  const nextMonthFormat = format(addMonths(currentMonth, 1), "yyyy-MM");
  const hasNextMonth = schedules?.some(schedule => schedule.month === nextMonthFormat);
  console.log("Has schedule for next month:", hasNextMonth, {
    nextMonthFormat,
    availableMonths: schedules?.map(s => s.month)
  });

  if (isLoading) {
    return (
      <Loading />
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        p={3}
        textAlign="center"
      >
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Please make sure this feature is properly configured by your landlord.
        </Typography>
      </Box>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-5 rounded-lg min-h-screen">
        <Container maxWidth="md">
          {/* Room Details Card */}
          {tenantDetails && (
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Room Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography color="text.secondary" variant="body2">
                      Building
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {tenantDetails.room.building}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography color="text.secondary" variant="body2">
                      Room Number
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {tenantDetails.room.roomNumber}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Calendar Card */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Select Date
              </Typography>

              {/* Calendar Header */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <IconButton
                  onClick={handlePreviousMonth}
                  disabled={isBefore(
                    addMonths(currentMonth, -1),
                    startOfMonth(new Date())
                  )}
                  sx={{ color: theme.palette.text.primary }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {format(currentMonth, "MMMM yyyy")}
                </Typography>
                <IconButton
                  onClick={handleNextMonth}
                  disabled={
                    !schedules?.some(
                      (schedule) =>
                        schedule.month ===
                        format(addMonths(currentMonth, 1), "yyyy-MM")
                    )
                  }
                  sx={{ color: theme.palette.text.primary }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>

              {/* Calendar Grid */}
              <Grid container spacing={1}>
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <Grid item xs={12 / 7} key={day}>
                      <Typography
                        align="center"
                        variant="body2"
                        sx={{ color: theme.palette.text.secondary, mb: 1 }}
                      >
                        {day}
                      </Typography>
                    </Grid>
                  )
                )}

                {/* Empty cells for offset */}
                {[...Array(getMonthStartOffset(currentMonth))].map(
                  (_, index) => (
                    <Grid item xs={12 / 7} key={`empty-${index}`}>
                      <Button
                        disabled
                        fullWidth
                        sx={{
                          aspectRatio: "1/1",
                          minWidth: 0,
                          visibility: "hidden",
                        }}
                      >
                        <Typography variant="body2">{"0"}</Typography>
                      </Button>
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
                  const isSelected =
                    selectedDate && isSameDay(day, selectedDate);
                  const isPast = isDayInPast(day);

                  return (
                    <Grid item xs={12 / 7} key={day.toString()}>
                      <Button
                        onClick={() => setSelectedDate(hasSlots ? day : null)}
                        fullWidth
                        variant={isSelected ? "contained" : "outlined"}
                        disabled={!hasSlots || isPast}
                        sx={{
                          aspectRatio: "1/1",
                          minWidth: 0,
                          p: 0,
                          borderColor: hasSlots ? "primary.main" : "divider",
                          backgroundColor: isSelected
                            ? "primary.main"
                            : "transparent",
                          "&:hover": {
                            backgroundColor: isSelected
                              ? "primary.dark"
                              : "action.hover",
                          },
                          position: "relative",
                        }}
                      >
                        <Typography
                          variant="body2"
                          color={
                            isSelected
                              ? "white"
                              : isPast
                              ? "text.disabled"
                              : "text.primary"
                          }
                        >
                          {format(day, "d")}
                        </Typography>
                        {hasSlots && !isSelected && !isPast && (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 4,
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              backgroundColor: "primary.main",
                            }}
                          />
                        )}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>

          {/* Time Slots */}
          {selectedDate && (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Available Times for {format(selectedDate, "MMMM d, yyyy")}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {getSlotsForDate(selectedDate).map((slot) => (
                    <Paper
                      key={slot._id}
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        "&:last-child": { mb: 0 },
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body1">
                          {slot.fromTime} - {slot.toTime}
                        </Typography>
                        {!slot.bookedBy && (
                          <Button
                            variant="contained"
                            onClick={() =>
                              handleBookSlot(slot.scheduleId, slot)
                            }
                            sx={{ textTransform: "none" }}
                          >
                            Book
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Dialog */}
          <Dialog
            open={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            PaperProps={{
              sx: { borderRadius: 2 },
            }}
          >
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogContent>
              {selectedSlot && (
                <>
                  <Typography variant="body1" gutterBottom>
                    Are you sure you want to book cleaning service for:
                  </Typography>
                  <Box sx={{ mt: 2, fontWeight: 500 }}>
                    <Typography variant="body1">
                      {format(selectedSlot.date, "MMMM d, yyyy")}
                    </Typography>
                    <Typography variant="body1">
                      {selectedSlot.fromTime} - {selectedSlot.toTime}
                    </Typography>
                  </Box>
                </>
              )}
              {bookingError && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {bookingError}
                </Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 0 }}>
              <Button
                onClick={() => setShowConfirmModal(false)}
                sx={{ textTransform: "none" }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBooking}
                disabled={isBooking}
                variant="contained"
                sx={{ textTransform: "none" }}
              >
                {isBooking ? "Booking..." : "Confirm"}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </div>
    </Suspense>
  );
}
