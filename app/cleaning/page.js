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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Snackbar,
  Alert,
  Avatar,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";

// Loading Spinner Component
const LoadingSpinner = ({ size = 'large' }) => {
  const sizes = {
    small: {
      wrapper: "w-6 h-6",
      position: "left-[11px] top-[6px]",
      bar: "w-[2px] h-[4px]",
      origin: "origin-[1px_7px]"
    },
    medium: {
      wrapper: "w-24 h-24",
      position: "left-[47px] top-[24px]",
      bar: "w-1.5 h-3",
      origin: "origin-[3px_26px]"
    },
    large: {
      wrapper: "w-48 h-48",
      position: "left-[94px] top-[48px]",
      bar: "w-3 h-6",
      origin: "origin-[6px_52px]"
    }
  };

  return (
    <div className={`${sizes[size].wrapper} inline-block overflow-hidden bg-transparent`}>
      <div className="w-full h-full relative transform scale-100 origin-[0_0]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute ${sizes[size].position} ${sizes[size].bar} rounded-[5.76px] bg-[#898f63] ${sizes[size].origin}`}
            style={{
              transform: `rotate(${i * 30}deg)`,
              animation: `spinner-fade 1s linear infinite`,
              animationDelay: `${-0.0833 * (12 - i)}s`
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes spinner-fade {
          0% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
};


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
  const [showAddHousekeeperDialog, setShowAddHousekeeperDialog] = useState(false);
  const [assignedHousekeepers, setAssignedHousekeepers] = useState([]);
  const [availableHousekeepers, setAvailableHousekeepers] = useState([]);
  const [selectedHousekeeper, setSelectedHousekeeper] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const theme = useTheme();

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

  useEffect(() => {
    const fetchHousekeepers = async () => {
      if (!selectedBuilding || !session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/building/housekeepers?buildingId=${selectedBuilding}&landlordId=${session.user.id}`);
        if (!response.ok) throw new Error("Failed to fetch housekeepers");
        const data = await response.json();
        setAssignedHousekeepers(data.assignedHousekeepers);
        setAvailableHousekeepers(data.availableHousekeepers);
      } catch (error) {
        console.error("Error fetching housekeepers:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch housekeepers",
          severity: "error"
        });
      }
    };

    fetchHousekeepers();
  }, [selectedBuilding, session?.user?.id]);

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
      >
        <LoadingSpinner size="large" />
      </Box>
    );
  }

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

  const handleAddHousekeeper = async () => {
    if (!selectedHousekeeper) return;

    try {
      const response = await fetch("/api/building/housekeepers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingId: selectedBuilding,
          housekeeperId: selectedHousekeeper
        })
      });

      if (!response.ok) throw new Error("Failed to add housekeeper");
      const data = await response.json();

      setAssignedHousekeepers(data.housekeepers);
      setAvailableHousekeepers(prev => prev.filter(h => h._id !== selectedHousekeeper));
      setSelectedHousekeeper("");
      setShowAddHousekeeperDialog(false);
      setSnackbar({
        open: true,
        message: "Housekeeper added successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error adding housekeeper:", error);
      setSnackbar({
        open: true,
        message: "Failed to add housekeeper",
        severity: "error"
      });
    }
  };

  const handleRemoveHousekeeper = async (housekeeperId) => {
    try {
      const response = await fetch(
        `/api/building/housekeepers?buildingId=${selectedBuilding}&housekeeperId=${housekeeperId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to remove housekeeper");
      const data = await response.json();

      const removedHousekeeper = assignedHousekeepers.find(h => h._id === housekeeperId);
      setAssignedHousekeepers(data.housekeepers);
      setAvailableHousekeepers(prev => [...prev, removedHousekeeper]);
      setSnackbar({
        open: true,
        message: "Housekeeper removed successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error removing housekeeper:", error);
      setSnackbar({
        open: true,
        message: "Failed to remove housekeeper",
        severity: "error"
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Title and Add Button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" color="#898f63" fontWeight={600}>
          Cleaning Schedule
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push("/cleaning/add")}
          startIcon={<AddIcon sx={{ color: 'white' }} />}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            backgroundColor: "#898F63",
            color: "white",
            "&:hover": {
              backgroundColor: "#777c54"
            }
          }}
        >
          Add Schedule
        </Button>
      </Box>

      {/* Building Selection */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: theme.shadows[1] }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom fontWeight={500}>
            Select Building
          </Typography>
          {isLoadingBuildings ? (
            <Box display="flex" justifyContent="center" p={2}>
              <LoadingSpinner size="small" />
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
          {/* Housekeepers Section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2" fontWeight={500}>
                Housekeepers
              </Typography>
              <Button
                variant="contained"
                onClick={() => setShowAddHousekeeperDialog(true)}
                startIcon={<AddIcon sx={{ color: 'white' }} />}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  backgroundColor: "#898F63",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#777c54"
                  }
                }}
              >
                Add Housekeeper
              </Button>
            </Box>
            
            <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[1] }}>
              <CardContent sx={{ p: 0 }}>
                {assignedHousekeepers.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {assignedHousekeepers.map((housekeeper, index) => (
                      <ListItem
                        key={housekeeper._id}
                        divider={index !== assignedHousekeepers.length - 1}
                        sx={{ 
                          px: 3,
                          py: 2,
                          display: 'flex',
                          alignItems: 'center',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.01)'
                          }
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleRemoveHousekeeper(housekeeper._id)}
                            sx={{ 
                              color: theme.palette.error.main,
                              opacity: 0.8,
                              '&:hover': {
                                opacity: 1,
                                bgcolor: 'error.lighter'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: '#898F63',
                              width: 40,
                              height: 40,
                              mr: 2
                            }}
                          >
                            {housekeeper.firstName[0]}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{ 
                                fontWeight: 500,
                                color: 'text.primary',
                                mb: 0.5
                              }}
                            >
                              {`${housekeeper.firstName} ${housekeeper.lastName}`}
                            </Typography>
                            <Typography 
                              variant="body2"
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                color: 'text.secondary'
                              }}
                            >
                              <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {housekeeper.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      No housekeepers assigned to this building
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Add Housekeeper Dialog */}
          <Dialog
            open={showAddHousekeeperDialog}
            onClose={() => setShowAddHousekeeperDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Add Housekeeper</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Housekeeper</InputLabel>
                <Select
                  value={selectedHousekeeper}
                  onChange={(e) => setSelectedHousekeeper(e.target.value)}
                  label="Select Housekeeper"
                >
                  {availableHousekeepers.map((housekeeper) => (
                    <MenuItem key={housekeeper._id} value={housekeeper._id}>
                      {`${housekeeper.firstName} ${housekeeper.lastName}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowAddHousekeeperDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddHousekeeper}
                variant="contained"
                sx={{
                  bgcolor: "#889F63",
                  "&:hover": { bgcolor: "#6B7F4F" },
                }}
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>

          {/* Calendar View */}
          <Box sx={{ mb: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" fontWeight={500}>
                Calendar
              </Typography>
              <Box>
                <Button
                  onClick={() => handleMonthChange(-1)}
                  startIcon={<ChevronLeft />}
                >
                  Previous
                </Button>
                <Typography variant="subtitle1" component="span" sx={{ mx: 2 }}>
                  {format(currentMonth, "MMMM yyyy")}
                </Typography>
                <Button
                  onClick={() => handleMonthChange(1)}
                  endIcon={<ChevronRight />}
                >
                  Next
                </Button>
              </Box>
            </Box>

            <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[1] }}>
              <CardContent sx={{ p: 2 }}>
                {isLoadingSchedules ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <LoadingSpinner size="medium" />
                  </Box>
                ) : (
                  <Box>
                    {/* Calendar Grid */}
                    <Grid container spacing={1} sx={{ mb: 1 }}>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <Grid item xs={12 / 7} key={day}>
                            <Typography
                              align="center"
                              variant="body2"
                              sx={{ fontWeight: 500, color: 'text.secondary' }}
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
          </Box>

          {/* Booking Details */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" component="h2" fontWeight={500} sx={{ mb: 2 }}>
              Booking Details
            </Typography>
            <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[1] }}>
              <CardContent sx={{ p: 2 }}>
                {isLoadingSchedules ? (
                  <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center"
                  minHeight="200px" 
                  p={3}
                >
                  <LoadingSpinner />
                  </Box>
                ) : getCurrentMonthSchedule()?.slots?.length > 0 ? (
                  getCurrentMonthSchedule()?.slots.map((slot, index, array) => (
                    <Box
                      key={slot._id}
                      sx={{
                        p: 2,
                        mb: index !== array.length - 1 ? 2 : 0,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
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
                    </Box>
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
                      sx={{ 
                        mt: 2, 
                        textTransform: "none",
                        color: "#898F63",
                        borderColor: "#898F63",
                        '&:hover': {
                          borderColor: "#707454",
                          backgroundColor: "rgba(137, 143, 99, 0.04)"
                        }
                      }}
                    >
                      Add New Schedule
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </>
      )}

      {/* Snackbar for notifications */}
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
