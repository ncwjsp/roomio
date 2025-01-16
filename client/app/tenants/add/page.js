"use client";

import { useState } from "react";
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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import { useSession } from "next-auth/react";
import Providers from "@/app/components/Providers";

const AddTenant = () => {
  const { data: session } = useSession();
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
  const [roomsPerPage] = useState(5);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [loadingBuildings, setLoadingBuildings] = useState(false);

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

      // Success
      setSuccess(true);

      // Reset form
      setTenantData({
        name: "",
        email: "",
        phone: "",
        lineId: "",
        pfp: "",
        room: "",
        depositAmount: "",
      });
      setFromDate("");
      setToDate("");
      setSelectedRoom(null);
      setSelectedFriend(null);
      setActiveStep(0);
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
      const response = await fetch("/api/friend");
      const data = await response.json();

      // Extract the friends array from the data object
      setFriends(Array.isArray(data.friends) ? data.friends : []);
    } catch (error) {
      console.error("Error fetching friends:", error);
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

  const handleOpenRoomModal = async () => {
    if (!session?.user?.id) {
      console.error("No user session found");
      return;
    }

    setLoadingRooms(true);
    setLoadingBuildings(true);
    try {
      // Fetch rooms
      const roomsResponse = await fetch("/api/room");
      const roomsData = await roomsResponse.json();
      console.log("Rooms data:", roomsData);
      setRooms(Array.isArray(roomsData.rooms) ? roomsData.rooms : []);

      // Fetch buildings with user ID from session
      const buildingsResponse = await fetch(
        `/api/building?id=${session.user.id}`
      );
      const buildingsData = await buildingsResponse.json();
      console.log("Buildings data:", buildingsData);
      setBuildings(
        Array.isArray(buildingsData.buildings) ? buildingsData.buildings : []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      setRooms([]);
      setBuildings([]);
    } finally {
      setLoadingRooms(false);
      setLoadingBuildings(false);
    }
    setOpenRoomModal(true);
  };

  const handleCloseRoomModal = () => {
    setOpenRoomModal(false);
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setTenantData((prev) => ({
      ...prev,
      room: room.name,
    }));
    setOpenRoomModal(false);
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
        const matchesSearch = room.name
          .toLowerCase()
          .includes(roomSearchQuery.toLowerCase());
        const matchesBuilding =
          selectedBuilding === "all" || room.buildingId === selectedBuilding;
        const isAvailable = room.status !== "Occupied";
        return matchesSearch && matchesBuilding && isAvailable;
      })
      .sort((a, b) => {
        if (roomSortBy === "name") {
          return roomSortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else {
          return roomSortOrder === "asc"
            ? a.floor - b.floor
            : b.floor - a.floor;
        }
      });
  };

  const getPaginatedRooms = () => {
    const filteredRooms = getSortedAndFilteredRooms();
    const startIndex = (roomPage - 1) * roomsPerPage;
    return {
      paginatedRooms: filteredRooms.slice(
        startIndex,
        startIndex + roomsPerPage
      ),
      totalPages: Math.ceil(filteredRooms.length / roomsPerPage),
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
                    ? "Change LINE Friend"
                    : "Select LINE Friend *"}
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
              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  variant="outlined"
                  startIcon={<MeetingRoomIcon />}
                  onClick={handleOpenRoomModal}
                  className={`
                    rounded-lg py-3 px-6
                    ${
                      errors.room
                        ? "border-red-500 text-red-500 hover:bg-red-50"
                        : ""
                    }
                  `}
                >
                  {selectedRoom ? "Change Room" : "Select Room *"}
                </Button>

                {selectedRoom && (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 relative flex-grow max-w-md">
                    <div className="flex-grow">
                      <Typography className="font-semibold">
                        Room {selectedRoom.name}
                      </Typography>
                      <Typography variant="caption" className="text-gray-600">
                        Floor {selectedRoom.floor} • {selectedRoom.type}
                      </Typography>
                    </div>
                    <IconButton
                      onClick={handleDeselectRoom}
                      className="absolute right-2 top-2 bg-white hover:bg-gray-100 shadow-sm"
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </div>
                )}
              </div>
              {errors.room && (
                <Typography className="mt-1 text-sm text-red-500 ml-2">
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] max-h-[80vh] bg-white shadow-xl p-6 rounded-lg overflow-auto">
          <Typography id="room-modal-title" variant="h6" className="mb-4">
            Select Room
          </Typography>

          <div className="flex gap-4 mb-6">
            <FormControl size="small" className="min-w-[200px]">
              <InputLabel>Building</InputLabel>
              <Select
                value={selectedBuilding}
                label="Building"
                onChange={(e) => setSelectedBuilding(e.target.value)}
              >
                <MenuItem value="all">All Buildings</MenuItem>
                {buildings.map((building) => (
                  <MenuItem key={building._id} value={building._id}>
                    {building.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search rooms..."
              value={roomSearchQuery}
              onChange={(e) => setRoomSearchQuery(e.target.value)}
              className="flex-grow"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" className="min-w-[120px]">
              <InputLabel>Sort by</InputLabel>
              <Select
                value={roomSortBy}
                label="Sort by"
                onChange={(e) => setRoomSortBy(e.target.value)}
              >
                <MenuItem value="name">Room Number</MenuItem>
                <MenuItem value="floor">Floor</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              onClick={() =>
                setRoomSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              size="small"
            >
              {roomSortOrder === "asc" ? "↑" : "↓"}
            </IconButton>
          </div>

          {loadingRooms ? (
            <div className="flex justify-center p-4">
              <CircularProgress />
            </div>
          ) : (
            <>
              <List className="w-full">
                {getPaginatedRooms().paginatedRooms.map((room) => (
                  <ListItem
                    key={room._id}
                    onClick={() => handleSelectRoom(room)}
                    className="mb-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <ListItemText
                      primary={`Room ${room.name}`}
                      secondary={
                        <Typography component="span" variant="body2">
                          Floor {room.floor} • {room.type}
                          {room.status && (
                            <span className="ml-2 text-green-600">
                              • {room.status}
                            </span>
                          )}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <div className="flex justify-center mt-4">
                <Pagination
                  count={getPaginatedRooms().totalPages}
                  page={roomPage}
                  onChange={(e, newPage) => setRoomPage(newPage)}
                  color="primary"
                  size="small"
                />
              </div>
            </>
          )}

          <div className="flex justify-end mt-4">
            <Button onClick={handleCloseRoomModal}>Cancel</Button>
          </div>
        </div>
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
