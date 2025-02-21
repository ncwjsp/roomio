"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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
  Paper,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

// Loading Spinner Component
const LoadingSpinner = () => {
  return (
    <div className="w-48 h-48 inline-block overflow-hidden bg-transparent">
      <div className="w-full h-full relative transform scale-100 origin-[0_0]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute left-[94px] top-[48px] w-3 h-6 rounded-[5.76px] bg-[#898f63] origin-[6px_52px]"
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
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newBuilding, setNewBuilding] = useState("");
  const [newPrice, setNewPrice] = useState(5000);
  const [numFloors, setNumFloors] = useState(4);
  const [roomsPerFloor, setRoomsPerFloor] = useState(10);
  const [electricityRate, setElectricityRate] = useState(7);
  const [waterRate, setWaterRate] = useState(15);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [modalBuildingId, setModalBuildingId] = useState("");
  const [modalFloorNumber, setModalFloorNumber] = useState("");
  const [modalBuildingData, setModalBuildingData] = useState(null);
  const [roomPrice, setRoomPrice] = useState(5000);
  const [roomNumber, setRoomNumber] = useState("");
  const [roomFormErrors, setRoomFormErrors] = useState({});

  const [hasLoaded, setHasLoaded] = useState(false);

  const [formErrors, setFormErrors] = useState({});

  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteBuildingDialog, setShowDeleteBuildingDialog] =
    useState(false);
  const [showDeleteRoomDialog, setShowDeleteRoomDialog] = useState(false);
  const [showEditBuildingDialog, setShowEditBuildingDialog] = useState(false);

  // Add these state variables
  const [floors, setFloors] = useState([]);
  const [roomNumberPreview, setRoomNumberPreview] = useState("");
  const [showDeleteBuildingConfirm, setShowDeleteBuildingConfirm] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState(null);

  const resetForm = () => {
    setNewBuilding("");
    setNewPrice(5000);
    setNumFloors(4);
    setRoomsPerFloor(10);
    setElectricityRate(7);
    setWaterRate(15);
    setFormErrors({});
  };

  const fetchBuildings = async () => {
    try {
      if (!session?.user?.id) {
        console.log("No session or user ID, skipping fetch");
        return;
      }

      setIsLoading(true);
      setError(null);

      // Then fetch buildings
      const buildingsResponse = await fetch(
        `/api/building?id=${session.user.id}`
      );
      const buildingsData = await buildingsResponse.json();

      if (buildingsData.buildings) {
        setBuildings(buildingsData.buildings);
        
        // Fetch rooms after getting buildings
        const roomsResponse = await fetch("/api/room");
        const roomsData = await roomsResponse.json();
        
        if (roomsData.rooms) {
          setRoomCards(roomsData.rooms);
        }
        
        setHasLoaded(true);
      }
    } catch (error) {
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

    if (status === "authenticated" && session?.user?.id) {
      fetchBuildings();
    }
  }, [status, session?.user?.id, refreshTrigger]);

  const getNextRoomNumber = (building, floor) => {
    if (!building || !floor) {
      console.log("Missing building or floor");
      return null;
    }

    // Add defensive checks for the room data
    const validRooms = roomCards.filter(room => 
      room?.floor?.building?._id && 
      room?.floor?.floorNumber && 
      room?.roomNumber
    );

    // Filter rooms for this specific building and floor
    const floorRooms = validRooms.filter(
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
    }).filter(num => !isNaN(num)); // Filter out any NaN values

    if (roomNumbers.length === 0) {
      return `${building.name}${floor}01`;
    }

    console.log("Room numbers found:", roomNumbers);
    const highestNumber = Math.max(...roomNumbers);
    console.log("Highest number:", highestNumber);

    // Add 1 to the highest number and ensure it's two digits
    const nextNumber = highestNumber + 1;
    return `${building.name}${floor}${String(nextNumber).padStart(2, "0")}`;
  };

  const getFloorOptions = () => {
    if (selectedBuilding && selectedBuilding !== "") {
      // If a building is selected, only show floors from that building
      const building = buildings.find((b) => b._id === selectedBuilding);
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
        ? room.floor.building._id === selectedBuilding
        : true;
      const matchesStatus = selectedStatus ? room.status === selectedStatus : true;
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

  const validateForm = () => {
    const errors = {};

    if (!numFloors || isNaN(Number(numFloors)) || Number(numFloors) <= 0) {
      errors.numFloors = "Number of floors must be greater than 0";
    }

    if (!roomsPerFloor || isNaN(Number(roomsPerFloor)) || Number(roomsPerFloor) <= 0) {
      errors.roomsPerFloor = "Rooms per floor must be greater than 0";
    }

    if (!newPrice || isNaN(Number(newPrice)) || Number(newPrice) <= 0) {
      errors.basePrice = "Base price must be greater than 0";
    }

    if (!electricityRate || isNaN(Number(electricityRate)) || Number(electricityRate) <= 0) {
      errors.electricityRate = "Electricity rate must be greater than 0";
    }

    if (!waterRate || isNaN(Number(waterRate)) || Number(waterRate) <= 0) {
      errors.waterRate = "Water rate must be greater than 0";
    }

    if (!newBuilding || !newBuilding.trim()) {
      errors.buildingName = "Building name is required";
    }

    return errors;
  };

  const handleAddBuilding = async () => {
    try {
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setIsLoading(true);
      const response = await fetch("/api/building", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newBuilding.trim(),
          totalFloors: Number(numFloors),
          roomsPerFloor: Number(roomsPerFloor),
          electricityRate: Number(electricityRate),
          waterRate: Number(waterRate),
          basePrice: Number(newPrice),
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add building");
      }

      setShowModal(false);
      resetForm();
      setRefreshTrigger((prev) => prev + 1);

      setSnackbar({
        open: true,
        message: "Building added successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (modalBuildingId) {
      const building = buildings.find((b) => b._id === modalBuildingId);
      setModalBuildingData(building);
      // Reset floor when building changes
      setModalFloorNumber("");
    }
  }, [modalBuildingId, buildings]);

  const validateRoomPrice = (price) => {
    if (!price) return "";
    if (Number(price) <= 0) return "Price must be greater than 0";
    return "";
  };

  const validateRoomNumber = (number) => {
    if (!number) return "";
    if (!/^\d+$/.test(number)) return "Room number must contain only numbers";
    return "";
  };

  const updateRoomNumberPreview = (number, buildingId) => {
    if (!buildingId || !number) {
      setRoomNumberPreview("");
      return;
    }

    const building = buildings.find(b => b._id === buildingId);
    if (building) {
      setRoomNumberPreview(`${building.name}${number}`);
    }
  };

  const handleAddRoom = async () => {
    try {
      // Reset form errors
      setRoomFormErrors({});
      let hasErrors = false;

      // Validate all fields
      const priceError = validateRoomPrice(roomPrice);
      if (priceError) {
        setRoomFormErrors(prev => ({
          ...prev,
          price: priceError
        }));
        hasErrors = true;
      }

      const roomNumberError = validateRoomNumber(roomNumber);
      if (roomNumberError) {
        setRoomFormErrors(prev => ({
          ...prev,
          roomNumber: roomNumberError
        }));
        hasErrors = true;
      }

      if (!modalBuildingId || !modalFloorNumber) {
        setSnackbar({
          open: true,
          message: "Please fill in all required fields",
          severity: "error",
        });
        return;
      }

      if (hasErrors) {
        return;
      }

      const building = buildings.find((b) => b._id === modalBuildingId);
      if (!building) {
        setSnackbar({
          open: true,
          message: "Selected building not found",
          severity: "error",
        });
        return;
      }

      const floor = building.floors.find(
        (f) => f.floorNumber === parseInt(modalFloorNumber)
      );
      if (!floor) {
        setSnackbar({
          open: true,
          message: "Selected floor not found",
          severity: "error",
        });
        return;
      }

      setIsLoading(true);

      const response = await fetch("/api/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          floor: floor._id,
          roomNumber: `${building.name}${roomNumber}`,
          price: Number(roomPrice),
          createdBy: session?.user?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add room");
      }

      setShowAddRoomModal(false);
      resetRoomForm();
      setRefreshTrigger((prev) => prev + 1);

      setSnackbar({
        open: true,
        message: "Room added successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    } finally {
      setIs(false);
    }
  };

  const resetRoomForm = () => {
    setModalBuildingId("");
    setModalBuildingData(null);
    setModalFloorNumber("");
    setRoomPrice(5000);
    setRoomNumber("");
    setRoomFormErrors({});
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

  const router = useRouter();

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
    try {
      setIsLoading(true);
      const response = await fetch(`/api/building/${buildingToDelete._id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete building");
      }

      setSnackbar({
        open: true,
        message: "Building deleted successfully",
        severity: "success",
      });
      
      // Refresh buildings list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteBuildingConfirm(false);
      setBuildingToDelete(null);
    }
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
      if (modalBuildingId) {
        try {
          const response = await fetch(
            `/api/building/${modalBuildingId}/floors`
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
  }, [modalBuildingId]);

  // Add console logs to debug
  const handleBuildingSelect = async (buildingId) => {
    console.log("Selected Building ID:", buildingId);
    setModalBuildingId(buildingId);
    
    if (!buildingId) {
      setModalBuildingData(null);
      setModalFloorNumber("");
      return;
    }

    const building = buildings.find((b) => b._id === buildingId);
    console.log("Found Building Data:", building);
    
    if (building) {
      setModalBuildingData(building);
      // Reset floor selection when building changes
      setModalFloorNumber("");
    }
    updateRoomNumberPreview(roomNumber, buildingId);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="container px-4 py-8">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" sx={{ color: "#898F63", fontWeight: 600 }}>
            Buildings
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            {buildings.length > 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ color: "white" }} />}
                onClick={() => setShowAddRoomModal(true)}
                sx={{
                  bgcolor: "#898F63",
                  "&:hover": {
                    bgcolor: "#7C8F59",
                  },
                  textTransform: "none",
                }}
              >
                Add Room
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ color: "white" }} />}
              onClick={() => setShowModal(true)}
              sx={{
                bgcolor: "#898F63",
                "&:hover": {
                  bgcolor: "#7C8F59",
                },
                textTransform: "none",
              }}
            >
              Add Building
            </Button>
          </Box>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <LoadingSpinner sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '80vh',
          width: '100%'
        }} />
          </Box>
        ) : error ? (
          <Box textAlign="center" my={4}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : buildings.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
              textAlign: "center",
              p: 4,
              bgcolor: "#fff",
              borderRadius: 2,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <Box
              component="img"
              src="/building-empty.svg"
              alt="No buildings"
              sx={{
                width: "200px",
                height: "200px",
                mb: 3,
                opacity: 0.7,
              }}
            />
            <Typography variant="h5" sx={{ color: "#898F63", mb: 1, fontWeight: 600 }}>
              No Buildings Found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: "500px" }}>
              Start managing your properties by adding your first building. Click the "Add Building" button above to get started.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModal(true)}
              sx={{
                bgcolor: "#898F63",
                "&:hover": {
                  bgcolor: "#7C8F59",
                },
                textTransform: "none",
                px: 3,
                py: 1,
              }}
            >
              Add Your First Building
            </Button>
          </Box>
        ) : (
          <>
            {/* Filter Section */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "#898F63",
              }}
            >
              <Typography variant="h6" sx={{ color: "white", mb: 2, fontWeight: 600 }}>
                Filter Rooms
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "black" }}>Building</InputLabel>
                    <Select
                      value={selectedBuilding}
                      onChange={(e) => {
                        setSelectedBuilding(e.target.value);
                        setSelectedFloor("");
                        setCurrentPage(1);
                      }}
                      renderValue={(value) => {
                        if (!value) return "All Buildings";
                        const building = buildings.find(b => b._id === value);
                        return building ? `Building ${building.name}` : "";
                      }}
                      sx={{
                        bgcolor: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255, 255, 255, 0.5)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "white",
                        },
                      }}
                    >
                      <MenuItem value="">All Buildings</MenuItem>
                      {buildings.map((building) => (
                        <MenuItem key={building._id} value={building._id}>
                          <div className="flex justify-between items-center w-full">
                            <span>Building {building.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBuildingToDelete(building);
                                setShowDeleteBuildingConfirm(true);
                              }}
                              className="ml-4 text-red-500 hover:text-red-700 bg-transparent border-none p-0"
                              style={{ background: 'transparent' }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                style={{ backgroundColor: 'transparent' }}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "black" }}>Floor</InputLabel>
                    <Select
                      value={selectedFloor}
                      onChange={(e) => {
                        setSelectedFloor(e.target.value);
                        setCurrentPage(1);
                      }}
                      sx={{
                        bgcolor: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255, 255, 255, 0.5)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "white",
                        },
                      }}
                    >
                      <MenuItem value="">All Floors</MenuItem>
                      {getFloorOptions().map((floorNum) => (
                        <MenuItem key={floorNum} value={floorNum}>
                          Floor {floorNum}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "black" }}>Status</InputLabel>
                    <Select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      sx={{
                        bgcolor: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255, 255, 255, 0.5)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "white",
                        },
                      }}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="Available">Available</MenuItem>
                      <MenuItem value="Unavailable">Unavailable</MenuItem>
                      <MenuItem value="Occupied">Occupied</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by Room Number"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "white",
                        "& fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.5)",
                        },
                        "&:hover fieldset": {
                          borderColor: "white",
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Room Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {paginatedRooms.map((room) => (
                <div
                  key={room._id}
                  onClick={() => handleRoomClick(room)}
                  className={`p-4 rounded-lg text-center cursor-pointer transition-all hover:scale-105 ${
                    room.status === "Available"
                      ? "bg-[#898F63] text-white hover:border-[#e7e7e7]"
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
            <Grid container spacing={3}>
              {/* Building Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Building Name"
                  value={newBuilding}
                  onChange={(e) => setNewBuilding(e.target.value)}
                  error={!!formErrors.buildingName}
                  helperText={formErrors.buildingName}
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
                  error={!!formErrors.basePrice}
                  helperText={formErrors.basePrice}
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
                  error={!!formErrors.numFloors}
                  helperText={formErrors.numFloors}
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
                  error={!!formErrors.roomsPerFloor}
                  helperText={formErrors.roomsPerFloor}
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
                  onChange={(e) => setElectricityRate(e.target.value)}
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
                  onChange={(e) => setWaterRate(e.target.value)}
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
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            sx={{
              color: "#898F63",
              "&:hover": {
                bgcolor: "rgba(136, 159, 99, 0.08)",
              },
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddBuilding}
            disabled={
              !newBuilding?.trim() || 
              !numFloors || 
              !roomsPerFloor || 
              !newPrice || 
              Number(newPrice) <= 0 ||
              !electricityRate || 
              !waterRate || 
              Number(electricityRate) <= 0 || 
              Number(waterRate) <= 0
            }
            sx={{
              bgcolor: "#898F63",
              "&:hover": {
                bgcolor: "#7C8F59",
              },
              textTransform: "none",
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
                  value={modalBuildingId}
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
              <FormControl fullWidth disabled={!modalBuildingId}>
                <InputLabel>Floor Number</InputLabel>
                <Select
                  value={modalFloorNumber}
                  onChange={(e) => setModalFloorNumber(e.target.value)}
                  label="Floor Number"
                >
                  <MenuItem value="">
                    <em>Select floor</em>
                  </MenuItem>
                  {modalBuildingData &&
                    modalBuildingData.floors &&
                    modalBuildingData.floors
                      .sort((a, b) => a.floorNumber - b.floorNumber)
                      .map((floor) => (
                        <MenuItem key={floor._id} value={floor.floorNumber}>
                          Floor {floor.floorNumber}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Room Number */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Room Number"
                value={roomNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers
                  if (value === '' || /^\d+$/.test(value)) {
                    setRoomNumber(value);
                    updateRoomNumberPreview(value, modalBuildingId);
                    const error = validateRoomNumber(value);
                    setRoomFormErrors(prev => ({
                      ...prev,
                      roomNumber: error
                    }));
                  }
                }}
                error={!!roomFormErrors.roomNumber}
                helperText={roomFormErrors.roomNumber}
                required
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
              />
            </Grid>

            {/* Room Number Preview */}
            {roomNumberPreview && (
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
                    Room Number Preview:
                  </Typography>
                  <Typography variant="h6" color="#898F63">
                    {roomNumberPreview}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Room Price */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Room Price"
                type="number"
                value={roomPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  setRoomPrice(value);
                  const error = validateRoomPrice(value);
                  setRoomFormErrors(prev => ({
                    ...prev,
                    price: error
                  }));
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">฿</InputAdornment>
                  ),
                }}
                error={!!roomFormErrors.price}
                helperText={roomFormErrors.price}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleCloseModal}
            sx={{
              color: "#898F63",
              "&:hover": {
                bgcolor: "rgba(136, 159, 99, 0.08)",
              },
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddRoom}
            disabled={
              !modalBuildingId || 
              !modalFloorNumber || 
              !roomNumber || 
              Number(roomPrice) <= 0 ||
              isLoading
            }
            sx={{
              bgcolor: "#898F63",
              "&:hover": {
                bgcolor: "#7C8F59",
              },
              textTransform: "none",
            }}
          >
            {isLoading ? <LoadingSpinner size={24} /> : "Add Room"}
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
          <DeleteIcon sx={{ mr: 1, fontSize: 20, color: "#d32f2f" }} />
          Delete Room
        </MenuItem>
        <MenuItem onClick={() => {
          setBuildingToDelete(selectedBuilding);
          setShowDeleteBuildingConfirm(true);
        }} sx={{ color: "#d32f2f" }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20, color: "#d32f2f" }} />
          Delete Building
        </MenuItem>
      </Menu>

      {/* Confirmation Dialogs */}
      <Dialog
        open={showDeleteBuildingConfirm}
        onClose={() => {
          setShowDeleteBuildingConfirm(false);
          setBuildingToDelete(null);
        }}
      >
        <DialogTitle>Delete Building</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete building {buildingToDelete?.name}? This will delete all floors and rooms in this building. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowDeleteBuildingConfirm(false);
              setBuildingToDelete(null);
            }}
            sx={{ color: "#898F63" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteBuilding}
            variant="contained"
            sx={{
              bgcolor: "#d32f2f",
              "&:hover": {
                bgcolor: "#7a4040",
              },
              textTransform: "none",
            }}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showDeleteBuildingDialog}
        onClose={() => setShowDeleteBuildingDialog(false)}
      >
        <DialogTitle>Delete Building</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this building? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setShowDeleteBuildingDialog(false)}
            sx={{
              color: "#898F63",
              "&:hover": {
                bgcolor: "rgba(136, 159, 99, 0.08)",
              },
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteBuilding}
            sx={{
              bgcolor: "#d32f2f",
              "&:hover": {
                bgcolor: "#7a4040",
              },
              textTransform: "none",
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showEditBuildingDialog}
        onClose={() => setShowEditBuildingDialog(false)}
      >
        <DialogTitle>Edit Building</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to edit this building?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setShowEditBuildingDialog(false)}
            sx={{
              color: "#898F63",
              "&:hover": {
                bgcolor: "rgba(136, 159, 99, 0.08)",
              },
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditBuilding}
            disabled={!selectedBuilding}
            sx={{
              bgcolor: "#898F63",
              "&:hover": {
                bgcolor: "#7C8F59",
              },
              textTransform: "none",
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showDeleteRoomDialog}
        onClose={() => setShowDeleteRoomDialog(false)}
      >
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this room? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setShowDeleteRoomDialog(false)}
            sx={{
              color: "#898F63",
              "&:hover": {
                bgcolor: "rgba(136, 159, 99, 0.08)",
              },
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteRoom}
            sx={{
              bgcolor: "#d32f2f",
              "&:hover": {
                bgcolor: "#7a4040",
              },
              textTransform: "none",
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
