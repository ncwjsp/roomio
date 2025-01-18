"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Box,
  Typography,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Modal,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Autocomplete,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import { useSession } from "next-auth/react";
import Providers from "@/app/components/Providers";
import { useRouter } from "next/navigation";

const AddTenant = () => {
  const { data: session, status } = useSession();
  const [activeStep, setActiveStep] = useState(0);
  const [tenantData, setTenantData] = useState({
    name: "",
    email: "",
    phone: "",
    lineId: "",
    pfp: "",
    room: "",
    depositAmount: "",
  });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [openFriendModal, setOpenFriendModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [errors, setErrors] = useState({});
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [roomSortBy, setRoomSortBy] = useState("name");
  const [roomSortOrder, setRoomSortOrder] = useState("asc");
  const [roomPage, setRoomPage] = useState(1);
  const roomsPerPage = 12;
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState("all");
  const [selectedFloorFilter, setSelectedFloorFilter] = useState("all");
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTenantData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!selectedRoom || !fromDate || !toDate || !tenantData.depositAmount) {
        throw new Error("Please fill in all required fields");
      }

      const tenantPayload = {
        owner: session?.user?.id,
        name: tenantData.name,
        email: tenantData.email,
        phone: tenantData.phone,
        lineId: tenantData.lineId,
        pfp: tenantData.pfp,
        room: selectedRoom._id,
        leaseStartDate: fromDate,
        leaseEndDate: toDate,
        depositAmount: Number(tenantData.depositAmount),
      };

      const response = await fetch("/api/tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tenantPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add tenant");
      }

      // Success - redirect to tenants page
      router.push("/tenants");
    } catch (error) {
      console.error("Error adding tenant:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFriendModal = async () => {
    setLoadingFriends(true);
    try {
      const response = await fetch("/api/linecontact");
      const data = await response.json();

      // Extract the lineContacts array from the data object
      setFriends(Array.isArray(data.lineContacts) ? data.lineContacts : []);
    } catch (error) {
      console.error("Error fetching LINE contacts:", error);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
    setOpenFriendModal(true);
  };

  const handleCloseFriendModal = () => {
    setOpenFriendModal(false);
  };

  const handleDeselectFriend = () => {
    setSelectedFriend(null);
    setTenantData((prev) => ({
      ...prev,
      pfp: "",
    }));
  };

  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
    setTenantData((prev) => ({
      ...prev,
      pfp: friend.pfp || "",
    }));
    setOpenFriendModal(false);
  };

  const getSortedAndFilteredFriends = () => {
    return friends
      .filter(
        (friend) =>
          friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          friend.lineId.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else {
          return sortOrder === "asc"
            ? new Date(a.createdAt) - new Date(b.createdAt)
            : new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
  };

  const getPaginatedFriends = () => {
    const filteredFriends = getSortedAndFilteredFriends();
    const startIndex = (page - 1) * itemsPerPage;
    return {
      paginatedFriends: filteredFriends.slice(
        startIndex,
        startIndex + itemsPerPage
      ),
      totalPages: Math.ceil(filteredFriends.length / itemsPerPage),
    };
  };

  const handleOpenRoomModal = () => setOpenRoomModal(true);
  const handleCloseRoomModal = () => setOpenRoomModal(false);

  const handleSelectRoom = (room) => {
    setSelectedRoom({
      _id: room._id,
      roomNumber: room.roomNumber,
      floor: {
        floorNumber: room.floorNumber,
        building: {
          name: room.buildingName,
        },
      },
    });
    setTenantData((prev) => ({
      ...prev,
      room: room._id,
    }));
    handleCloseRoomModal();
  };

  const handleDeselectRoom = () => {
    setSelectedRoom(null);
    setTenantData((prev) => ({
      ...prev,
      room: "",
    }));
  };

  const getSortedAndFilteredRooms = () => {
    return rooms
      .filter((room) => {
        // Check if room exists and has a roomNumber
        if (!room || !room.roomNumber) return false;

        const matchesSearch = roomSearchQuery
          ? room.roomNumber
              .toLowerCase()
              .includes(roomSearchQuery.toLowerCase())
          : true;

        const matchesBuilding =
          selectedBuilding === "all" ||
          room.floor?.building?._id === selectedBuilding;

        const isAvailable = room.status === "Available";

        return matchesSearch && matchesBuilding && isAvailable;
      })
      .sort((a, b) => {
        if (roomSortBy === "name") {
          return roomSortOrder === "asc"
            ? a.roomNumber.localeCompare(b.roomNumber, undefined, {
                numeric: true,
              })
            : b.roomNumber.localeCompare(a.roomNumber, undefined, {
                numeric: true,
              });
        } else {
          return roomSortOrder === "asc"
            ? a.floor?.floorNumber - b.floor?.floorNumber
            : b.floor?.floorNumber - a.floor?.floorNumber;
        }
      });
  };

  const getPaginatedRooms = () => {
    const startIndex = (roomPage - 1) * roomsPerPage;
    const endIndex = startIndex + roomsPerPage;
    const totalRooms = buildings.reduce(
      (acc, building) =>
        acc +
        building.floors.reduce(
          (floorAcc, floor) =>
            floorAcc +
            floor.rooms.filter((room) => room.status === "Available").length,
          0
        ),
      0
    );
    const totalPages = Math.ceil(totalRooms / roomsPerPage);

    return { totalPages };
  };

  const getFloorNumbers = () => {
    if (selectedBuildingFilter === "all") {
      return buildings
        .flatMap((building) =>
          building.floors.map((floor) => floor.floorNumber)
        )
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => a - b);
    }

    const building = buildings.find((b) => b._id === selectedBuildingFilter);
    return building
      ? building.floors.map((floor) => floor.floorNumber).sort((a, b) => a - b)
      : [];
  };

  const getPaginatedBuildingData = () => {
    const itemsPerPage = 12;
    const startIndex = (roomPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const allRooms = buildings.reduce((acc, building) => {
      if (
        selectedBuildingFilter !== "all" &&
        building._id !== selectedBuildingFilter
      ) {
        return acc;
      }

      const buildingRooms = building.floors.reduce((floorAcc, floor) => {
        if (
          selectedFloorFilter !== "all" &&
          floor.floorNumber !== parseInt(selectedFloorFilter)
        ) {
          return floorAcc;
        }

        const availableRooms = floor.rooms
          .filter((room) => room.status === "Available")
          .map((room) => ({
            ...room,
            floorNumber: floor.floorNumber,
            buildingName: building.name,
          }));
        return [...floorAcc, ...availableRooms];
      }, []);
      return [...acc, ...buildingRooms];
    }, []);

    const sortedRooms = allRooms.sort((a, b) => {
      if (a.buildingName !== b.buildingName) {
        return a.buildingName.localeCompare(b.buildingName);
      }
      if (a.floorNumber !== b.floorNumber) {
        return a.floorNumber - b.floorNumber;
      }
      return a.roomNumber.localeCompare(b.roomNumber, undefined, {
        numeric: true,
      });
    });

    const paginatedRooms = sortedRooms.slice(startIndex, endIndex);
    const totalPages = Math.ceil(sortedRooms.length / itemsPerPage);

    return {
      paginatedRooms,
      totalPages,
      totalRooms: sortedRooms.length,
    };
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                name="name"
                value={tenantData.name}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
                sx={{ backgroundColor: "white" }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={tenantData.email}
                onChange={(e) => {
                  handleInputChange(e);
                  if (e.target.value && !isValidEmail(e.target.value)) {
                    setErrors((prev) => ({
                      ...prev,
                      email: "Please enter a valid email address",
                    }));
                  } else {
                    setErrors((prev) => ({
                      ...prev,
                      email: undefined,
                    }));
                  }
                }}
                fullWidth
                required
                error={!!errors.email}
                helperText={errors.email}
                sx={{ backgroundColor: "white" }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Phone"
                name="phone"
                value={tenantData.phone}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.phone}
                helperText={errors.phone}
                sx={{ backgroundColor: "white" }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="LINE ID"
                name="lineId"
                value={tenantData.lineId}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.lineId}
                helperText={errors.lineId}
                sx={{ backgroundColor: "white" }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: errors.friend ? 3 : 2,
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenFriendModal}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 3,
                    borderColor: errors.friend ? "error.main" : "primary.main",
                    color: errors.friend ? "error.main" : "primary.main",
                    "&:hover": {
                      borderColor: errors.friend
                        ? "error.dark"
                        : "primary.dark",
                      backgroundColor: errors.friend
                        ? "error.50"
                        : "primary.50",
                    },
                  }}
                >
                  {selectedFriend
                    ? "Change LINE Contact"
                    : "Select LINE Contact *"}
                </Button>
                {selectedFriend && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: "grey.50",
                      position: "relative",
                    }}
                  >
                    <Avatar
                      src={selectedFriend.pfp}
                      alt={selectedFriend.name}
                      sx={{ width: 40, height: 40 }}
                    />
                    <Box>
                      <Typography variant="subtitle2">
                        {selectedFriend.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Added:{" "}
                        {dayjs(selectedFriend.createdAt).format("MMM D, YYYY")}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={handleDeselectFriend}
                      sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
              {errors.friend && (
                <Typography color="error" variant="caption" sx={{ ml: 2 }}>
                  {errors.friend}
                </Typography>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Lease Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<MeetingRoomIcon />}
                  onClick={handleOpenRoomModal}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 3,
                    borderColor: errors.room ? "error.main" : "primary.main",
                    color: errors.room ? "error.main" : "primary.main",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedRoom ? "Change Room" : "Select Room *"}
                </Button>

                {selectedRoom && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "grey.50",
                      position: "relative",
                      flex: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">
                        Room {selectedRoom.roomNumber}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Floor {selectedRoom.floor?.floorNumber || "N/A"} •{" "}
                        Building {selectedRoom.floor?.building?.name || "N/A"}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedRoom(null)}
                      sx={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
              {errors.room && (
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ display: "block", mt: 1, ml: 2 }}
                >
                  {errors.room}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Deposit Amount"
                name="depositAmount"
                type="number"
                value={tenantData.depositAmount}
                onChange={handleInputChange}
                fullWidth
                required
                sx={{ backgroundColor: "white" }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Lease Start Date"
                value={fromDate ? dayjs(fromDate) : null}
                onChange={(newValue) =>
                  setFromDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                }
                sx={{ width: "100%", backgroundColor: "white" }}
                slotProps={{
                  textField: {
                    required: true,
                    error: !!errors.fromDate,
                    helperText: errors.fromDate,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Lease End Date"
                value={toDate ? dayjs(toDate) : null}
                onChange={(newValue) =>
                  setToDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                }
                sx={{ width: "100%", backgroundColor: "white" }}
                slotProps={{
                  textField: {
                    required: true,
                    error: !!errors.toDate,
                    helperText: errors.toDate,
                  },
                }}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!tenantData.name.trim()) newErrors.name = "Name is required";
      if (!tenantData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!isValidEmail(tenantData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!tenantData.phone.trim()) newErrors.phone = "Phone is required";
      if (!selectedFriend) newErrors.friend = "Please select a LINE friend";
      if (!tenantData.lineId.trim()) newErrors.lineId = "LINE ID is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        if (!session?.user?.id) return;
        setIsLoading(true);

        const response = await fetch(`/api/building?id=${session.user.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch buildings");
        }

        const data = await response.json();
        console.log("Fetched buildings data:", data); // Debug log

        if (data.buildings) {
          setBuildings(data.buildings);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setErrorMessage("Failed to fetch buildings and rooms");
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== "loading") {
      fetchRooms();
    }
  }, [session, status]);

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          Add New Tenant
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Personal Information</StepLabel>
          </Step>
          <Step>
            <StepLabel>Lease Information</StepLabel>
          </Step>
        </Stepper>

        {loading && <CircularProgress />}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
            >
              Back
            </Button>
            {activeStep === 1 ? (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                Submit
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext} color="primary">
                Next
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Tenant added successfully"
      />

      <Modal
        open={openFriendModal}
        onClose={handleCloseFriendModal}
        aria-labelledby="friend-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            maxHeight: "80vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 1,
            overflow: "auto",
          }}
        >
          <Typography
            id="friend-modal-title"
            variant="h6"
            component="h2"
            gutterBottom
          >
            Select Friend
          </Typography>

          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="date">Date Added</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              size="small"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </IconButton>
          </Box>

          {loadingFriends ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <List sx={{ width: "100%", bgcolor: "background.paper" }}>
                {getPaginatedFriends().paginatedFriends.map((friend) => (
                  <ListItem
                    key={friend._id}
                    onClick={() => handleSelectFriend(friend)}
                    sx={{
                      mb: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={friend.pfp}
                        alt={friend.name}
                        sx={{ width: 50, height: 50, mr: 2 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={friend.name}
                      secondary={
                        <Typography component="span" variant="body2">
                          <Box component="span" display="block">
                            Added:{" "}
                            {dayjs(friend.createdAt).format("MMM D, YYYY")}
                          </Box>
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={getPaginatedFriends().totalPages}
                  page={page}
                  onChange={(e, newPage) => setPage(newPage)}
                  color="primary"
                  size="small"
                />
              </Box>
            </>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button onClick={handleCloseFriendModal}>Cancel</Button>
          </Box>
        </Box>
      </Modal>

      <Modal
        open={openRoomModal}
        onClose={handleCloseRoomModal}
        aria-labelledby="room-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 800,
            height: "80vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
            <Typography id="room-modal-title" variant="h6" gutterBottom>
              Select Room
            </Typography>

            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Building</InputLabel>
                <Select
                  value={selectedBuildingFilter}
                  label="Building"
                  onChange={(e) => {
                    setSelectedBuildingFilter(e.target.value);
                    setSelectedFloorFilter("all");
                    setRoomPage(1);
                  }}
                >
                  <MenuItem value="all">All Buildings</MenuItem>
                  {buildings.map((building) => (
                    <MenuItem key={building._id} value={building._id}>
                      {building.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Floor</InputLabel>
                <Select
                  value={selectedFloorFilter}
                  label="Floor"
                  onChange={(e) => {
                    setSelectedFloorFilter(e.target.value);
                    setRoomPage(1);
                  }}
                >
                  <MenuItem value="all">All Floors</MenuItem>
                  {getFloorNumbers().map((floorNumber) => (
                    <MenuItem key={floorNumber} value={floorNumber}>
                      Floor {floorNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              p: 3,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            ) : getPaginatedBuildingData().totalRooms === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <Typography color="text.secondary">
                  No available rooms found for the selected filters.
                </Typography>
              </Box>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 overflow-y-auto flex-1 pr-2">
                  {getPaginatedBuildingData().paginatedRooms.map((room) => (
                    <button
                      key={room._id}
                      onClick={() => handleSelectRoom(room)}
                      className={`
                        p-4 rounded-lg text-left transition-colors border
                        ${
                          selectedRoom?._id === room._id
                            ? "bg-[#898F63] text-white border-[#898F63]"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        }
                      `}
                    >
                      <div
                        className={`font-semibold ${
                          selectedRoom?._id === room._id
                            ? "text-white"
                            : "text-gray-900"
                        }`}
                      >
                        Room {room.roomNumber}
                      </div>
                      <div
                        className={`text-sm ${
                          selectedRoom?._id === room._id
                            ? "text-white/90"
                            : "text-gray-500"
                        }`}
                      >
                        Building {room.buildingName} • Floor {room.floorNumber}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Box>

          <Box
            sx={{
              p: 3,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Showing {getPaginatedBuildingData().paginatedRooms.length} of{" "}
              {getPaginatedBuildingData().totalRooms} rooms
            </Typography>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Pagination
                count={getPaginatedBuildingData().totalPages}
                page={roomPage}
                onChange={(e, page) => setRoomPage(page)}
                color="primary"
                size="small"
              />
              <Button onClick={handleCloseRoomModal}>Cancel</Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default function AddTenantPage() {
  return (
    <Providers>
      <AddTenant />
    </Providers>
  );
}
