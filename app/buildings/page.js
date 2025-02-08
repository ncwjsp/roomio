"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TextField,
  InputAdornment,
  Box,
  Button,
  Snackbar,
  Alert,
  Menu,
  DialogContentText,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const Buildings = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const id = session?.user?.id;
  const ROOMS_PER_PAGE = 18;

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [buildings, setBuildings] = useState([]);
  const [roomCards, setRoomCards] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newBuilding, setNewBuilding] = useState("");
  const [newPrice, setNewPrice] = useState(5000);
  const [numFloors, setNumFloors] = useState(4);
  const [roomsPerFloor, setRoomsPerFloor] = useState(10);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [selectedBuildingForRoom, setSelectedBuildingForRoom] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [roomPrice, setRoomPrice] = useState(5000);
  const [selectedBuildingData, setSelectedBuildingData] = useState(null);

  const [hasLoaded, setHasLoaded] = useState(false);

  const router = useRouter();

  // Add new state variables for utility rates
  const [electricityRate, setElectricityRate] = useState(0);
  const [waterRate, setWaterRate] = useState(0);

  const [billingCycle, setBillingCycle] = useState({
    startDate: 1,
    endDate: 28,
    dueDate: 5,
  });

  const [formErrors, setFormErrors] = useState({
    electricityRate: "",
    waterRate: "",
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteBuildingDialog, setShowDeleteBuildingDialog] =
    useState(false);
  const [showDeleteRoomDialog, setShowDeleteRoomDialog] = useState(false);
  const [showEditBuildingDialog, setShowEditBuildingDialog] = useState(false);

  // Add these state variables
  const [floors, setFloors] = useState([]);

  const resetForm = () => {
    setNewBuilding("");
    setNewPrice(5000);
    setNumFloors(4);
    setRoomsPerFloor(10);
    setElectricityRate(0);
    setWaterRate(0);
    setBillingCycle({
      startDate: 1,
      endDate: 28,
      dueDate: 5,
    });
  };

  const fetchBuildings = async () => {
    try {
      if (!session?.user?.id) {
        console.log("No session or user ID, skipping fetch");
        return;
      }

      setIsLoading(true);
      setError(null);

      // First, fetch all rooms directly
      const roomsResponse = await fetch("/api/room");
      const roomsData = await roomsResponse.json();
      console.log("Direct rooms fetch:", roomsData);

      // Then fetch buildings
      const buildingsResponse = await fetch(
        `/api/building?id=${session.user.id}`
      );
      const buildingsData = await buildingsResponse.json();

      if (buildingsData.buildings) {
        setBuildings(buildingsData.buildings);

        // Use the directly fetched rooms instead of extracting from buildings
        const allRooms = roomsData.rooms.map((room) => ({
          ...room,
          building: room.building,
          floor: room.floor,
        }));

        console.log("Room data structure:", allRooms[0]); // Log first room to see structure
        setRoomCards(allRooms);
        setHasLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status === "unauthenticated") {
      setError("Please sign in to view units");
      setIsLoading(false);
      return;
    }

    if (status === "authenticated" && session?.user?.id && !hasLoaded) {
      fetchBuildings();
    } else if (status === "authenticated" && hasLoaded) {
      setIsLoading(false);
    }
  }, [status, session, hasLoaded]);

  const handleRefresh = async () => {
    try {
      // Fetch without parameters to get all rooms
      const response = await fetch("/api/room");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch rooms");
      }
      const data = await response.json();
      setRoomCards(data.rooms);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  useEffect(() => {
    if (session) {
      handleRefresh();
    }
  }, [session]); // Add session as dependency

  const getFloorOptions = () => {
    if (selectedBuilding && selectedBuilding !== "") {
      // If a building is selected, only show floors from that building
      const building = buildings.find((b) => b.name === selectedBuilding);
      if (building) {
        return building.floors
          .map((floor) => floor.floorNumber)
          .sort((a, b) => a - b);
      }
      return [];
    }

    // If no building is selected, show all floors from all buildings
    const allFloors = buildings.flatMap((building) =>
      building.floors.map((floor) => floor.floorNumber)
    );

    return [...new Set(allFloors)].sort((a, b) => a - b);
  };

  const filteredRooms = roomCards
    .filter((room) => {
      // Make sure we have all required properties
      if (!room?.floor?.building || !room.roomNumber) {
        return false;
      }

      const matchesBuilding = selectedBuilding
        ? room.floor.building.name === selectedBuilding
        : true;
      const matchesStatus = filterStatus ? room.status === filterStatus : true;
      const matchesSearch = searchQuery
        ? room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesFloor = selectedFloor
        ? room.floor.floorNumber === parseInt(selectedFloor)
        : true;

      return matchesBuilding && matchesStatus && matchesSearch && matchesFloor;
    })
    .sort((a, b) => {
      if (a.floor.floorNumber !== b.floor.floorNumber) {
        return a.floor.floorNumber - b.floor.floorNumber;
      }
      return a.roomNumber.localeCompare(b.roomNumber);
    });

  // Add this console log to see filtered results
  console.log("Filtered rooms:", filteredRooms);

  const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * ROOMS_PER_PAGE,
    currentPage * ROOMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const validateUtilityRates = () => {
    const errors = {
      electricityRate: "",
      waterRate: "",
    };

    if (!electricityRate || Number(electricityRate) <= 0) {
      errors.electricityRate = "Electricity rate must be greater than 0";
    }

    if (!waterRate || Number(waterRate) <= 0) {
      errors.waterRate = "Water rate must be greater than 0";
    }

    setFormErrors(errors);
    return !errors.electricityRate && !errors.waterRate;
  };

  const handleAddBuilding = async () => {
    if (newBuilding.trim()) {
      if (!validateUtilityRates()) {
        return;
      }

      try {
        const response = await fetch("/api/building", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newBuilding.trim(),
            price: Number(newPrice),
            totalFloors: Number(numFloors),
            roomsPerFloor: Number(roomsPerFloor),
            electricityRate: Number(electricityRate),
            waterRate: Number(waterRate),
            userId: session?.user?.id,
            billingCycle: billingCycle,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create building");
        }

        setSnackbar({
          open: true,
          message: `Building ${newBuilding} was successfully created!`,
          severity: "success",
        });

        handleRefresh();
        setShowModal(false);
        resetForm();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.message,
          severity: "error",
        });
      }
    } else {
      setSnackbar({
        open: true,
        message: "Building name is required",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    if (selectedBuildingForRoom) {
      const building = buildings.find((b) => b._id === selectedBuildingForRoom);
      setSelectedBuildingData(building);
      // Reset floor when building changes
      setSelectedFloor("");
    }
  }, [selectedBuildingForRoom, buildings]);

  // Update the getNextRoomNumber function
  const getNextRoomNumber = (building, floor) => {
    if (!building || !floor) return null;

    // Filter rooms for this specific building and floor
    const floorRooms = roomCards.filter(
      (room) =>
        room.floor.building._id === building._id &&
        room.floor.floorNumber === parseInt(floor)
    );

    console.log(
      "Existing rooms for this floor:",
      floorRooms.map((r) => r.roomNumber)
    );

    if (floorRooms.length === 0) {
      // First room on this floor
      return `${building.name}${floor}01`;
    }

    // Find the highest room number
    const roomNumbers = floorRooms.map((room) => {
      // Extract only the last two digits
      const match = room.roomNumber.match(/\d{2}$/);
      return match ? parseInt(match[0]) : 0;
    });

    console.log("Room numbers found:", roomNumbers);
    const highestNumber = Math.max(...roomNumbers);
    console.log("Highest number:", highestNumber);

    // Add 1 to the highest number and ensure it's two digits
    const nextNumber = highestNumber + 1;
    return `${building.name}${floor}${String(nextNumber).padStart(2, "0")}`;
  };

  // Update the handleAddRoom function
  const handleAddRoom = async () => {
    try {
      if (!selectedBuildingForRoom || !selectedFloor) {
        setSnackbar({
          open: true,
          message: "Please select both building and floor",
          severity: "error",
        });
        return;
      }

      const building = buildings.find((b) => b._id === selectedBuildingForRoom);
      const floor = building.floors.find(
        (f) => f.floorNumber === parseInt(selectedFloor)
      );

      const response = await fetch("/api/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buildingId: selectedBuildingForRoom,
          roomNumber: getNextRoomNumber(building, selectedFloor),
          floor: floor._id,
          price: roomPrice,
          createdBy: session?.user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create room");
      }

      // Close modal and reset form
      setShowAddRoomModal(false);
      resetRoomForm();

      // Force a complete refresh of the buildings data
      await fetchBuildings();
      setRefreshTrigger((prev) => prev + 1); // Trigger a refresh

      setSnackbar({
        open: true,
        message: `Room added successfully!`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error in handleAddRoom:", error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  const resetRoomForm = () => {
    setSelectedBuildingForRoom("");
    setSelectedBuildingData(null);
    setSelectedFloor("");
    setRoomPrice(5000);
  };

  // Use this when closing the modal
  const handleCloseModal = () => {
    setShowAddRoomModal(false);
    resetRoomForm();
  };

  // Add this helper function to generate page numbers with ellipsis
  const getPageNumbers = (currentPage, totalPages) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handleRoomClick = (room) => {
    router.push(`/buildings/${room._id}`);
  };

  // Add this function to generate room number preview
  const getRoomNumberPreview = () => {
    if (!newBuilding || !roomsPerFloor || !numFloors) return "";

    const firstRoomNumber = `${newBuilding}101`;
    const lastRoomNumber = `${newBuilding}${numFloors}${String(
      roomsPerFloor
    ).padStart(2, "0")}`;
    return `${firstRoomNumber} - ${lastRoomNumber}`;
  };

  const handleMenuOpen = (event, building) => {
    setAnchorEl(event.currentTarget);
    setSelectedBuilding(building);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBuilding(null);
  };

  const handleDeleteBuilding = async () => {
    // Implement building deletion
    handleMenuClose();
  };

  const handleDeleteRoom = () => {
    setShowDeleteRoomDialog(true);
    handleMenuClose();
  };

  const handleEditBuilding = () => {
    setShowEditBuildingDialog(true);
    handleMenuClose();
  };

  // Add this effect to fetch floors when a building is selected
  useEffect(() => {
    const fetchFloors = async () => {
      if (selectedBuildingForRoom) {
        try {
          const response = await fetch(
            `/api/building/${selectedBuildingForRoom}/floors`
          );
          if (!response.ok) throw new Error("Failed to fetch floors");
          const data = await response.json();
          setFloors(data.floors);
        } catch (error) {
          setSnackbar({
            open: true,
            message: error.message,
            severity: "error",
          });
        }
      }
    };

    fetchFloors();
  }, [selectedBuildingForRoom]);

  // Add console logs to debug
  const handleBuildingSelect = (buildingId) => {
    console.log("Selected Building ID:", buildingId);
    setSelectedBuildingForRoom(buildingId);
    const building = buildings.find((b) => b._id === buildingId);
    console.log("Found Building Data:", building); // Check if totalFloors exists
    setSelectedBuildingData(building);
    setSelectedFloor("");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="container px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Buildings</h1>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
              onClick={() => setShowAddRoomModal(true)}
            >
              <AddIcon className="mr-1" /> Add Room
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setShowModal(true)}
            >
              Add Building
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CircularProgress size={40} sx={{ color: "#898F63" }} />
            <p className="mt-4 text-gray-600">Loading units...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : roomCards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No buildings found</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Filter Section */}
            <div className="p-6 rounded-lg shadow-sm mb-6 bg-gradient-to-br from-[#898F63] to-[#6B7355] text-white">
              <h4 className="text-lg font-semibold mb-4">Filter Rooms</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  className="w-full p-2 rounded text-gray-700"
                  value={selectedBuilding}
                  onChange={(e) => {
                    setSelectedBuilding(e.target.value);
                    setSelectedFloor(""); // Reset floor when building changes
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Buildings</option>
                  {buildings.map((building) => (
                    <option key={building._id} value={building.name}>
                      Building {building.name}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full p-2 rounded text-gray-700"
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Floors</option>
                  {getFloorOptions().map((floorNum) => (
                    <option key={floorNum} value={floorNum}>
                      Floor {floorNum}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full p-2 rounded text-gray-700"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="Occupied">Occupied</option>
                </select>

                <input
                  type="text"
                  className="w-full p-2 rounded text-gray-700"
                  placeholder="Search by Room Number"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {paginatedRooms.map((room) => (
                <div
                  key={room._id}
                  onClick={() => handleRoomClick(room)}
                  className={`p-4 rounded-lg text-center cursor-pointer transition-all hover:scale-105 ${
                    room.status === "Available"
                      ? "bg-gradient-to-br from-[#898F63] to-[#6B7355] text-white hover:border-[#e7e7e7]"
                      : room.status === "Unavailable"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-white text-gray-800 border border-gray-200 hover:border-[#898F63]"
                  }`}
                >
                  <h5 className="text-lg font-semibold">{room.roomNumber}</h5>
                  <p className="text-sm">{room.status}</p>
                  <p className="text-sm mt-1">฿{room.price.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-1">
                {/* Previous page button */}
                <button
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#898F63] text-white hover:bg-[#6B7355]"
                  }`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ←
                </button>

                {/* Page numbers */}
                {getPageNumbers(currentPage, totalPages).map(
                  (pageNum, index) => (
                    <button
                      key={index}
                      className={`px-3 py-1 rounded ${
                        pageNum === currentPage
                          ? "bg-white text-[#898F63] font-semibold"
                          : pageNum === "..."
                          ? "bg-transparent text-gray-500 cursor-default"
                          : "bg-[#898F63] text-white hover:bg-[#6B7355]"
                      }`}
                      onClick={() =>
                        pageNum !== "..." && handlePageChange(pageNum)
                      }
                      disabled={pageNum === "..."}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                {/* Next page button */}
                <button
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#898F63] text-white hover:bg-[#6B7355]"
                  }`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Building Modal */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Building</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Building Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Building Name"
                  value={newBuilding}
                  onChange={(e) => setNewBuilding(e.target.value)}
                  required
                />
              </Grid>

              {/* Base Price */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Base Price"
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">฿</InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>

              {/* Number of Floors */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of Floors"
                  type="number"
                  value={numFloors}
                  onChange={(e) => setNumFloors(e.target.value)}
                  required
                />
              </Grid>

              {/* Rooms per Floor */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rooms per Floor"
                  type="number"
                  value={roomsPerFloor}
                  onChange={(e) => setRoomsPerFloor(e.target.value)}
                  required
                />
              </Grid>

              {/* Room Number Preview */}
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2,
                    border: "1px dashed #ccc",
                    borderRadius: 1,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="caption" color="textSecondary">
                    Room Numbers Preview
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      mt: 0.5,
                    }}
                  >
                    {getRoomNumberPreview() || "Example: A101 - A410"}
                  </Typography>
                </Box>
              </Grid>

              {/* Utility Rates */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Utility Rates
                </Typography>
              </Grid>

              {/* Electricity Rate */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Electricity Rate (per unit)"
                  type="number"
                  value={electricityRate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setElectricityRate(value);
                    if (value && Number(value) > 0) {
                      setFormErrors((prev) => ({
                        ...prev,
                        electricityRate: "",
                      }));
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">฿</InputAdornment>
                    ),
                  }}
                  error={!!formErrors.electricityRate}
                  helperText={formErrors.electricityRate}
                  required
                />
              </Grid>

              {/* Water Rate */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Water Rate (per unit)"
                  type="number"
                  value={waterRate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setWaterRate(value);
                    if (value && Number(value) > 0) {
                      setFormErrors((prev) => ({ ...prev, waterRate: "" }));
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">฿</InputAdornment>
                    ),
                  }}
                  error={!!formErrors.waterRate}
                  helperText={formErrors.waterRate}
                  required
                />
              </Grid>

              {/* Billing Cycle */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Billing Cycle
                </Typography>
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Start Date</InputLabel>
                  <Select
                    value={billingCycle.startDate}
                    onChange={(e) =>
                      setBillingCycle({
                        ...billingCycle,
                        startDate: e.target.value,
                      })
                    }
                    label="Start Date"
                  >
                    {Array.from({ length: 28 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {i + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* End Date */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>End Date</InputLabel>
                  <Select
                    value={billingCycle.endDate}
                    onChange={(e) =>
                      setBillingCycle({
                        ...billingCycle,
                        endDate: e.target.value,
                      })
                    }
                    label="End Date"
                  >
                    {Array.from({ length: 28 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {i + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Due Date */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Due Date</InputLabel>
                  <Select
                    value={billingCycle.dueDate}
                    onChange={(e) =>
                      setBillingCycle({
                        ...billingCycle,
                        dueDate: e.target.value,
                      })
                    }
                    label="Due Date"
                  >
                    {Array.from({ length: 31 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {i + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleAddBuilding}
            variant="contained"
            sx={{
              bgcolor: "#898f63",
              "&:hover": { bgcolor: "#707454" },
            }}
          >
            Add Building
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Room Modal */}
      <Dialog
        open={showAddRoomModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            color: "#898F63",
            fontWeight: "semibold",
          }}
        >
          Add New Room
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            {/* Building Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Building</InputLabel>
                <Select
                  value={selectedBuildingForRoom}
                  onChange={(e) => handleBuildingSelect(e.target.value)}
                  label="Select Building"
                >
                  <MenuItem value="">
                    <em>Select a building</em>
                  </MenuItem>
                  {buildings.map((building) => (
                    <MenuItem key={building._id} value={building._id}>
                      Building {building.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Floor Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!selectedBuildingForRoom}>
                <InputLabel>Floor Number</InputLabel>
                <Select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  label="Floor Number"
                >
                  <MenuItem value="">
                    <em>Select floor</em>
                  </MenuItem>
                  {selectedBuildingData &&
                    selectedBuildingData.floors &&
                    selectedBuildingData.floors
                      .sort((a, b) => a.floorNumber - b.floorNumber)
                      .map((floor) => (
                        <MenuItem key={floor._id} value={floor.floorNumber}>
                          Floor {floor.floorNumber}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Room Price */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Room Price"
                type="number"
                value={roomPrice}
                onChange={(e) => setRoomPrice(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">฿</InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Preview Section */}
            {selectedBuildingForRoom && selectedFloor && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#f5f5f5",
                    borderRadius: 1,
                    border: "1px dashed #898F63",
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Next Room Number:
                  </Typography>
                  <Typography variant="h6" color="#898F63">
                    {getNextRoomNumber(
                      buildings.find((b) => b._id === selectedBuildingForRoom),
                      selectedFloor
                    )}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={handleCloseModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleAddRoom}
            variant="contained"
            sx={{
              bgcolor: "#898F63",
              "&:hover": { bgcolor: "#707454" },
            }}
          >
            Add Room
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleEditBuilding}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Building
        </MenuItem>
        <MenuItem onClick={handleAddRoom}>
          <AddIcon sx={{ mr: 1, fontSize: 20 }} />
          Add Room
        </MenuItem>
        <MenuItem onClick={handleDeleteRoom}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20, color: "orange" }} />
          Delete Room
        </MenuItem>
        <MenuItem onClick={handleDeleteBuilding} sx={{ color: "red" }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete Building
        </MenuItem>
      </Menu>

      {/* Confirmation Dialogs */}
      <Dialog
        open={showDeleteBuildingDialog}
        onClose={() => setShowDeleteBuildingDialog(false)}
      >
        <DialogTitle>Delete Building</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this building? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteBuildingDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteBuilding}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Similar dialogs for other actions */}
      {/* ... Add Room Modal ... */}
      {/* ... Edit Building Dialog ... */}
      {/* ... Delete Room Dialog ... */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 6 }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Buildings;
