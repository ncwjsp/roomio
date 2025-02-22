"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Button,
  TextField,
  Grid,
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
import PersonIcon from "@mui/icons-material/Person";

// Loading Spinner Component
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
    fromDate: "",
    toDate: "",
  });
  const [fromDate, setFromDate] = useState(dayjs());
  const [toDate, setToDate] = useState(dayjs().add(1, "year"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [openContactModal, setOpenContactModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
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
  const [meterReadings, setMeterReadings] = useState({
    water: 0,
    electricity: 0,
  });
  const [currentReadings, setCurrentReadings] = useState(null);
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
    try {
      setLoading(true);
      setError(null);

      if (!selectedContact) {
        setError("Please select a LINE contact");
        return;
      }

      if (!selectedRoom) {
        setError("Please select a room");
        return;
      }

      const response = await fetch("/api/tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tenantData.name,
          email: tenantData.email,
          phone: tenantData.phone,
          lineId: tenantData.lineId,
          lineUserId: selectedContact.userId,
          room: selectedRoom._id,
          fromDate: fromDate,
          toDate: toDate,
          depositAmount: parseFloat(tenantData.depositAmount),
          initialMeterReadings: meterReadings,
          landlordId: session.user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create tenant");
      }

      setSuccess(true);
      router.push("/tenants");
    } catch (error) {
      console.error("Error creating tenant:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenContactModal = async () => {
    if (!session?.user?.id) {
      console.error("No session or user ID available");
      return;
    }

    setLoadingContacts(true);
    try {
      const response = await fetch(`/api/linecontact?id=${session.user.id}`);
      const data = await response.json();

      setContacts(Array.isArray(data.lineContacts) ? data.lineContacts : []);
    } catch (error) {
      console.error("Error fetching LINE contacts:", error);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
    setOpenContactModal(true);
  };

  const handleCloseContactModal = () => {
    setOpenContactModal(false);
  };

  const handleDeselectContact = () => {
    setSelectedContact(null);
    setTenantData((prev) => ({
      ...prev,
      pfp: "",
    }));
  };

  const handleSelectContact = (contact) => {
    console.log("Selected Contact Data:", contact);
    if (!contact || !contact._id) {
      setError("Invalid LINE contact data");
      return;
    }
    setSelectedContact({
      id: contact._id,
      userId: contact.userId,
      name: contact.name || "",
      pfp: contact.pfp || "",
    });
    setTenantData((prev) => ({
      ...prev,
      pfp: contact.pfp || "",
    }));
    setOpenContactModal(false);
  };

  const getSortedAndFilteredContacts = () => {
    return contacts
      .filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.lineId.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getPaginatedContacts = () => {
    const filteredContacts = getSortedAndFilteredContacts();
    const startIndex = (page - 1) * itemsPerPage;
    return {
      paginatedContacts: filteredContacts.slice(
        startIndex,
        startIndex + itemsPerPage
      ),
      totalPages: Math.ceil(filteredContacts.length / itemsPerPage),
    };
  };

  const handleOpenRoomModal = () => setOpenRoomModal(true);
  const handleCloseRoomModal = () => setOpenRoomModal(false);

  const handleRoomSelect = async (room) => {
    setSelectedRoom(room);

    try {
      const response = await fetch(`/api/room/${room._id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch room details");
      }
      const roomData = await response.json();

      // Set current meter readings from room data
      setCurrentReadings(roomData.currentMeterReadings);

      // Initialize meter readings with current values
      setMeterReadings({
        water: roomData.currentMeterReadings.water || 0,
        electricity: roomData.currentMeterReadings.electricity || 0,
      });

      // Update selected room with populated data
      setSelectedRoom({
        ...roomData,
        buildingName: roomData.floor?.building?.name || "N/A",
        floorNumber: roomData.floor?.floorNumber || "N/A",
      });

      // Close the room selection modal
      setOpenRoomModal(false);
    } catch (error) {
      console.error("Error fetching room details:", error);
      setError("Failed to fetch room meter readings");
    }
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
                onChange={(e) =>
                  setTenantData((prev) => ({ ...prev, name: e.target.value }))
                }
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
                  mb: errors.contact ? 3 : 2,
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenContactModal}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 3,
                    borderColor: errors.contact ? "error.main" : "#898F63",
                    color: errors.contact ? "error.main" : "#898F63",
                    "&:hover": {
                      borderColor: errors.contact
                        ? "error.dark"
                        : "primary.dark",
                      backgroundColor: errors.contact
                        ? "error.50"
                        : "primary.50",
                    },
                  }}
                >
                  {selectedContact
                    ? "Change LINE Contact"
                    : "Select LINE Contact *"}
                </Button>
                {selectedContact && (
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
                      src={selectedContact.pfp}
                      alt={selectedContact.name}
                      sx={{ width: 40, height: 40 }}
                    />
                    <Box>
                      <Typography variant="subtitle2">
                        {selectedContact.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Added:{" "}
                        {dayjs(selectedContact.createdAt).format("MMM D, YYYY")}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={handleDeselectContact}
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
              {errors.contact && (
                <Typography color="error" variant="caption" sx={{ ml: 2 }}>
                  {errors.contact}
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
                    borderColor: errors.room ? "error.main" :  "#898F63",
                    color: errors.room ? "error.main" :  "#898F63",
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
                      onClick={handleDeselectRoom}
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

            {selectedRoom && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Meter Readings
                  </Typography>
                  {currentReadings && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Current readings - Water: {currentReadings.water} m³,
                      Electricity: {currentReadings.electricity} kWh
                      {currentReadings.lastUpdated &&
                        ` (Last updated: ${new Date(
                          currentReadings.lastUpdated
                        ).toLocaleDateString()})`}
                    </Alert>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Water Meter Reading"
                    type="number"
                    value={meterReadings.water}
                    onChange={(e) =>
                      handleMeterReadingChange("water", e.target.value)
                    }
                    fullWidth
                    required
                    InputProps={{
                      inputProps: { min: 0, step: "any" },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Electricity Meter Reading"
                    type="number"
                    value={meterReadings.electricity}
                    onChange={(e) =>
                      handleMeterReadingChange("electricity", e.target.value)
                    }
                    fullWidth
                    required
                    InputProps={{
                      inputProps: { min: 0, step: "any" },
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} md={6}>
              <DatePicker
                label="From Date *"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.fromDate,
                    helperText: errors.fromDate,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="To Date *"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.toDate,
                    helperText: errors.toDate,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Deposit Amount *"
                name="depositAmount"
                type="number"
                value={tenantData.depositAmount}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.depositAmount}
                helperText={errors.depositAmount}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">฿</InputAdornment>
                  ),
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
      if (!selectedContact) newErrors.contact = "Please select a LINE contact";
      if (!tenantData.lineId.trim()) newErrors.lineId = "LINE ID is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchAvailableRooms = async () => {
    try {
      const response = await fetch("/api/room", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }

      const data = await response.json();

      // Log all rooms with their status
      data.rooms.forEach((room) => {
        console.log(`Room ${room.roomNumber}: ${room.status}`);
      });

      // Filter and transform the rooms
      const availableRooms = data.rooms
        .filter((room) => {
          const isAvailable = room.status === "Available";
          console.log(
            `Filtering ${room.roomNumber}: status=${room.status}, isAvailable=${isAvailable}`
          );
          return isAvailable;
        })
        .map((room) => ({
          _id: room._id,
          roomNumber: room.roomNumber,
          building: room.floor?.building || {},
          floor: room.floor || {},
          price: room.price || 0,
        }))
        .sort((a, b) => {
          const buildingCompare = (a.building?.name || "").localeCompare(
            b.building?.name || ""
          );
          if (buildingCompare !== 0) return buildingCompare;

          const floorCompare =
            (a.floor?.floorNumber || 0) - (b.floor?.floorNumber || 0);
          if (floorCompare !== 0) return floorCompare;

          return a.roomNumber.localeCompare(b.roomNumber);
        });

      console.log("Available rooms after filtering:", availableRooms.length);
      setRooms(availableRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to fetch available rooms");
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Only proceed if we have a valid session
    if (session?.user?.id) {
      const fetchRooms = async () => {
        try {
          setIsLoading(true);

          const response = await fetch(`/api/building?id=${session.user.id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch buildings");
          }

          const data = await response.json();

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

      fetchRooms();
    }
  }, [session, status]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAvailableRooms();
    }
  }, [session]);

  // Add a handler for meter reading changes
  const handleMeterReadingChange = (type, value) => {
    setMeterReadings((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          Add New Tenant
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel StepIconProps={{
              style: {
                color: activeStep >= 0 ? '#898F63' : undefined,
              }
            }}>Personal Information</StepLabel>
          </Step>
          <Step>
            <StepLabel StepIconProps={{
              style: {
                color: activeStep >= 0 ? '#898F63' : undefined,
              }
            }}>Lease Information</StepLabel>
          </Step>
        </Stepper>

        {loading && <LoadingSpinner  />}
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
              sx={{
                color: "#898F63",
                borderColor: "#898F63",
                "&:hover": {
                  borderColor: "#7C8F59",
                  backgroundColor: "rgba(137, 143, 99, 0.04)"
                }
              }}
            >
              Back
            </Button>
            {activeStep === 1 ? (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{
                  bgcolor: "#898F63",
                  "&:hover": { bgcolor: "#7C8F59" },
                  minWidth: '100px'
                }}
              >
                {loading ? <LoadingSpinner /> : "Submit"}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext} sx={{
                bgcolor: "#898F63",
                "&:hover": {
                  bgcolor: "#7C8F59",
                },
              }}
              >
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
        open={openContactModal}
        onClose={handleCloseContactModal}
        aria-labelledby="contact-modal-title"
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
            id="contact-modal-title"
            variant="h6"
            component="h2"
            gutterBottom
          >
            Select LINE Contact
          </Typography>

          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search LINE contacts..."
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

          {loadingContacts ? (
             <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
               <LoadingSpinner  />
            </Box>
          ) : getPaginatedContacts().paginatedContacts.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 4,
                px: 2,
                bgcolor: "grey.50",
                borderRadius: 1,
              }}
            >
              <PersonIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No LINE Contacts Found
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ maxWidth: 300 }}
              >
                Add contacts by having them follow your LINE Official Account.
              </Typography>
            </Box>
          ) : (
            <>
              <List sx={{ width: "100%", bgcolor: "background.paper" }}>
                {getPaginatedContacts().paginatedContacts.map((contact) => (
                  <ListItem
                    key={contact._id}
                    onClick={() => handleSelectContact(contact)}
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
                        src={contact.pfp}
                        alt={contact.name}
                        sx={{ width: 50, height: 50, mr: 2 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={
                        <Typography component="span" variant="body2">
                          <Box component="span" display="block">
                            Added:{" "}
                            {dayjs(contact.createdAt).format("MMM D, YYYY")}
                          </Box>
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              {getPaginatedContacts().totalPages > 1 && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <Pagination
                    count={getPaginatedContacts().totalPages}
                    page={page}
                    onChange={(e, newPage) => setPage(newPage)}
                    color="primary"
                    size="small"
                  />
                </Box>
              )}
            </>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button onClick={handleCloseContactModal}
            sx={{
              color: "#d32f2f", // Red cancel button
              "&:hover": {
                backgroundColor: "rgba(148, 80, 80, 0.04)",
              },
            }}
            >Cancel</Button>
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
               <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <LoadingSpinner  />
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
                      onClick={() => handleRoomSelect(room)}
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
                color="primary"sx={{
                  '& .MuiPaginationItem-root.Mui-selected': {
                    bgcolor: '#898F63',
                    color: 'white',
                  },
                }}
                size="small"
              />
              <Button onClick={handleCloseRoomModal}>Cancel</Button>
            </Box>
          </Box>
        </Box>
      </Modal>
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Tenant added successfully"
      />
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
