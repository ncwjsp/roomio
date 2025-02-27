"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Autocomplete,
  TablePagination,
  Alert,
} from "@mui/material";
import {
  LocalShipping,
  Edit,
  Delete,
  CheckCircle,
  Add as AddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useSession } from "next-auth/react";

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

const ParcelsPage = () => {
  const { data: session } = useSession();
  const [parcels, setParcels] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterBuilding, setSelectedFilterBuilding] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [buildings, setBuildings] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParcel, setNewParcel] = useState({
    room: "",
    tenant: "",
    recipient: "",
    trackingNumber: "",
    status: "uncollected",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingParcel, setEditingParcel] = useState(null);
  const [trackingNumbersToDelete, setTrackingNumbersToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [formError, setFormError] = useState("");
  const [selectedModalBuilding, setSelectedModalBuilding] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);

  // Fetch parcels
  const fetchParcels = async () => {
    try {
      if (!session?.user?.id) return;

      const response = await fetch(
        `/api/parcels?landlordId=${session.user.id}`
      );
      if (!response.ok) throw new Error("Failed to fetch parcels");

      const { parcels: parcelData } = await response.json();
      setParcels(parcelData || []);
      setFilteredParcels(parcelData || []);
      setHasLoaded(true);

      // Get unique buildings using Set
      const uniqueBuildingsMap = new Map();
      (parcelData || []).forEach((parcel) => {
        const building = parcel.room?.floor?.building;
        if (building && building._id) {
          uniqueBuildingsMap.set(building._id, building);
        }
      });

      const uniqueBuildings = Array.from(uniqueBuildingsMap.values());
      setBuildings(uniqueBuildings);
    } catch (error) {
      console.error("Error fetching parcels:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (session?.user?.id && !hasLoaded) {
      fetchParcels();
    }
  }, [session, hasLoaded]);

  // Reset hasLoaded when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      setHasLoaded(false);
    }
  }, [session?.user?.id]);

  // Filter parcels
  useEffect(() => {
    let result = parcels;

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (parcel) =>
          parcel.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          parcel.room?.roomNumber?.toString().includes(searchQuery) ||
          parcel.trackingNumber
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Filter by building
    if (selectedFilterBuilding !== "all") {
      result = result.filter(
        (parcel) => parcel.room?.floor?.building?._id === selectedFilterBuilding
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      result = result.filter((parcel) => parcel.status === selectedStatus);
    }

    setFilteredParcels(result);
  }, [searchQuery, selectedFilterBuilding, selectedStatus, parcels]);

  // Fetch buildings when modal opens
  useEffect(() => {
    if (showAddForm) {
      fetchBuildings();
    }
  }, [showAddForm, session?.user?.id]);

  // Fetch rooms when building is selected
  useEffect(() => {
    if (selectedModalBuilding) {
      fetchRoomsByBuilding(selectedModalBuilding);
    } else {
      setAvailableRooms([]);
      setSelectedRoom("");
    }
  }, [selectedModalBuilding]);

  const fetchBuildings = async () => {
    try {
      if (!session?.user?.id) return;

      const response = await fetch(`/api/building?id=${session.user.id}`);
      if (!response.ok) throw new Error("Failed to fetch buildings");

      const data = await response.json();

      if (data.buildings) {
        setBuildings(data.buildings);
      } else {
        console.log("No buildings data in response");
        setBuildings([]);
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
      setError("Failed to fetch buildings");
    }
  };

  const fetchRoomsByBuilding = async (buildingId) => {
    try {
      setIsRoomsLoading(true);
      console.log("Fetching rooms for building:", buildingId);
      const response = await fetch(
        `/api/room?buildingId=${buildingId}&status=Occupied`
      );
      if (!response.ok) throw new Error("Failed to fetch rooms");

      const data = await response.json();
      console.log("Rooms data:", data);

      if (data.rooms && Array.isArray(data.rooms)) {
        const occupiedRooms = data.rooms.filter(
          (room) => room.status === "Occupied" && room.tenant
        );
        console.log("Filtered occupied rooms:", occupiedRooms);
        setAvailableRooms(occupiedRooms);
      } else {
        setAvailableRooms([]); // Set empty array if no rooms or invalid data
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to fetch rooms");
      setAvailableRooms([]); // Set empty array on error
    } finally {
      setIsRoomsLoading(false);
    }
  };

  // Fetch available rooms when modal opens
  useEffect(() => {
    if (showAddForm) {
      fetchAvailableRooms();
    }
  }, [showAddForm]);

  const fetchAvailableRooms = async () => {
    try {
      const response = await fetch("/api/room?status=Occupied");
      const data = await response.json();
      setAvailableRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  // Handle room selection
  const handleRoomSelect = (roomId) => {
    const selectedRoom = availableRooms.find((room) => room._id === roomId);
    if (selectedRoom) {
      setNewParcel({
        ...newParcel,
        room: selectedRoom._id,
        tenant: selectedRoom.tenant?._id || "",
        recipient: selectedRoom.tenant?.name || "",
      });
      setSelectedRoom(roomId);
    }
  };

  // Validate tracking number format
  const validateTrackingNumber = (trackingNumber) => {
    // Trim whitespace
    const trimmed = trackingNumber.trim();
    
    // Basic validation - ensure it's not empty and has a reasonable length
    if (!trimmed) {
      setFormError("Tracking number cannot be empty");
      return false;
    }
    
    if (trimmed.length < 3) {
      setFormError("Tracking number is too short");
      return false;
    }
    
    return true;
  };

  const handleAddParcel = async () => {
    try {
      // Clear any previous errors
      setFormError("");
      
      // Validate tracking number
      if (!validateTrackingNumber(newParcel.trackingNumber)) {
        return;
      }
      
      const response = await fetch("/api/parcels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newParcel,
          landlordId: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setFormError(errorData.error || "Failed to add parcel");
        return;
      }

      const data = await response.json();
      setParcels((prevParcels) => [data, ...prevParcels]);
      setFilteredParcels((prevParcels) => [data, ...prevParcels]);

      // Reset modal and form
      handleCloseModal();

      // Show success message if you have one
      // setSuccessMessage("Parcel added successfully");
      // setShowNotification(true);
    } catch (error) {
      console.error("Error adding parcel:", error);
      setFormError(error.message || "An unexpected error occurred");
      // Handle error notification if you have one
      // setErrorMessage(error.message);
      // setShowNotification(true);
    }
  };

  const handleEditParcel = async () => {
    try {
      if (!editingParcel) {
        console.error("Editing parcel is not set");
        return;
      }

      const response = await fetch("/api/parcels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: editingParcel.trackingNumber,
          updates: editingParcel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to edit parcel");
      }

      const updatedParcel = await response.json();
      setParcels((prev) =>
        prev.map((parcel) =>
          parcel.trackingNumber === updatedParcel.trackingNumber
            ? updatedParcel
            : parcel
        )
      );
      setIsEditing(false);
      setEditingParcel(null);
    } catch (error) {
      console.error("Error editing parcel:", error);
    }
  };

  const handleToggleStatus = (parcel) => {
    const newStatus =
      parcel.status === "uncollected" ? "collected" : "uncollected";

    fetch("/api/parcels", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingNumber: parcel.trackingNumber,
        updates: {
          status: newStatus,
          collectedAt: newStatus === "collected" ? new Date() : null,
        },
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to update parcel status");
        }
        return res.json();
      })
      .then((updatedParcel) =>
        setParcels((prev) =>
          prev.map((p) =>
            p.trackingNumber === updatedParcel.trackingNumber
              ? updatedParcel
              : p
          )
        )
      )
      .catch((error) => console.error("Error updating parcel status:", error));
  };

  const handleDeleteParcels = () => {
    fetch("/api/parcels", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumbers: trackingNumbersToDelete }),
    }).then(() =>
      setParcels((prev) =>
        prev.filter(
          (parcel) => !trackingNumbersToDelete.includes(parcel.trackingNumber)
        )
      )
    );
    setTrackingNumbersToDelete([]);
    setIsDeleting(false);
  };

  const handleBuildingSelect = async (buildingId) => {
    setSelectedRoom("");
    setNewParcel({
      ...newParcel,
      room: "",
      tenant: "",
      recipient: "",
    });

    if (buildingId) {
      console.log("Selected building ID:", buildingId);
      setSelectedModalBuilding(buildingId);
      await fetchRoomsByBuilding(buildingId);
    } else {
      setAvailableRooms([]);
    }
  };

  const handleCloseModal = () => {
    setShowAddForm(false);
    setSelectedModalBuilding("");
    setSelectedRoom("");
    setFormError(""); // Clear any error messages
    setNewParcel({
      room: "",
      tenant: "",
      recipient: "",
      trackingNumber: "",
      status: "uncollected",
    });
    setAvailableRooms([]);
  };

  useEffect(() => {}, [buildings]);

  // Add pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Edit button click handler
  const handleEditClick = (parcel) => {
    setIsEditing(true);
    setEditingParcel(parcel);
  };

  // Delete button click handler
  const handleDeleteClick = (trackingNumber) => {
    setTrackingNumbersToDelete([trackingNumber]);
    setIsDeleting(true);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <LoadingSpinner  />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: "bold", color: "#898F63" }}
        >
          Parcels Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ color: "white" }}/>}
          onClick={() => setShowAddForm(true)}
          sx={{
            backgroundColor: "#898F63",
            "&:hover": { backgroundColor: "#777c54" },
          }}
        >
          Add Parcel
        </Button>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={4}>
        <TextField
          placeholder="Search parcels..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Building</InputLabel>
          <Select
            value={selectedFilterBuilding}
            onChange={(e) => setSelectedFilterBuilding(e.target.value)}
            label="Building"
          >
            <MenuItem key="filter-all-buildings" value="all">
              All Buildings
            </MenuItem>
            {buildings && buildings.length > 0 ? (
              buildings.map((building, index) => (
                <MenuItem
                  key={`filter-building-${building._id}-${index}`}
                  value={building._id}
                >
                  {building.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem key="filter-no-buildings" disabled>
                No buildings available
              </MenuItem>
            )}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            label="Status"
          >
            <MenuItem key="all-status" value="all">
              All Status
            </MenuItem>
            <MenuItem key="uncollected" value="uncollected">
              Not Collected
            </MenuItem>
            <MenuItem key="collected" value="collected">
              Collected
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Parcels Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>Room</TableCell>
              <TableCell>Building</TableCell>
              <TableCell>Recipient</TableCell>
              <TableCell>Tracking Number</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParcels
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((parcel) => (
                <TableRow key={parcel._id}>
                  <TableCell>{parcel.room?.roomNumber}</TableCell>
                  <TableCell>{parcel.room?.floor?.building?.name}</TableCell>
                  <TableCell>{parcel.recipient}</TableCell>
                  <TableCell>{parcel.trackingNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        parcel.status === "uncollected"
                          ? "Uncollected"
                          : "Collected"
                      }
                      color={
                        parcel.status === "uncollected" ? "error" : "success"
                      }
                      size="small"
                      sx={{
                        color: "white",
                        "& .MuiChip-label": {
                          color: "white",
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={
                          parcel.status === "uncollected" ? (
                            <CheckCircle sx={{ color: "white" }}/>
                          ) : (
                            <LocalShipping sx={{ color: "white" }}/>
                          )
                        }
                        onClick={() => handleToggleStatus(parcel)}
                        sx={{
                          backgroundColor:
                            parcel.status === "uncollected"
                              ? "#898F63"
                              : "#FF9800",
                        }}
                      >
                        {parcel.status === "uncollected"
                          ? "Mark Collected"
                          : "Mark Uncollected"}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit sx={{ color: "white" }} />}
                        onClick={() => handleEditClick(parcel)}
                        sx={{ backgroundColor: "#FFA000" }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Delete sx={{ color: "white" }} />}
                        onClick={() => handleDeleteClick(parcel.trackingNumber)}
                        sx={{ 
                          backgroundColor: "#d32f2f",
                          color: "white",
                          "&:hover": { backgroundColor: "#b71c1c" }
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredParcels.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: "1px solid rgba(224, 224, 224, 1)",
          }}
        />
      </TableContainer>

      {/* Add Parcel Dialog */}
      <Dialog
        open={showAddForm}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Parcel</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Building</InputLabel>
                  <Select
                    value={selectedModalBuilding}
                    onChange={(e) => handleBuildingSelect(e.target.value)}
                    label="Building"
                  >
                    <MenuItem value="">Select Building</MenuItem>
                    {buildings.map((building) => (
                      <MenuItem key={building._id} value={building._id}>
                        {building.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Room</InputLabel>
                  <Select
                    value={selectedRoom}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                    label="Room"
                    disabled={!selectedModalBuilding || isRoomsLoading}
                  >
                    {isRoomsLoading ? (
                      <MenuItem value="">
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                          <LoadingSpinner  />
                          Loading rooms...
                        </Box>
                      </MenuItem>
                    ) : !Array.isArray(availableRooms) ||
                      availableRooms.length === 0 ? (
                      <MenuItem value="" disabled>
                        No rooms available
                      </MenuItem>
                    ) : (
                      availableRooms.map((room) => (
                        <MenuItem key={room._id} value={room._id}>
                          Room {room.roomNumber}{" "}
                          {room.tenant?.name ? `- ${room.tenant.name}` : ""}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipient Name"
                  value={newParcel.recipient}
                  onChange={(e) =>
                    setNewParcel({ ...newParcel, recipient: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tracking Number"
                  value={newParcel.trackingNumber}
                  onChange={(e) =>
                    setNewParcel({
                      ...newParcel,
                      trackingNumber: e.target.value.trim(),
                    })
                  }
                  onBlur={(e) => {
                    // Normalize tracking number on blur
                    const normalized = e.target.value.trim();
                    setNewParcel({
                      ...newParcel,
                      trackingNumber: normalized,
                    });
                  }}
                  error={formError.includes("tracking number")}
                  helperText={formError.includes("tracking number") ? formError : ""}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}
          sx={{ 
            color: "#d32f2f",
            "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.04)" } 
          }}
          >Cancel</Button>
          <Button
            onClick={handleAddParcel}
            variant="contained"
            disabled={
              !newParcel.room ||
              !newParcel.recipient ||
              !newParcel.trackingNumber
            }
            sx={{ 
              backgroundColor: "#898F63",
              color: "white",
              "&:hover": { backgroundColor: "#777c54" }
            }}
          >
            {isRoomsLoading ? <LoadingSpinner /> : "Add Parcel"}
      </Button>
    </DialogActions>
  </Dialog>


      {/* Edit Dialog */}
      <Dialog
        open={isEditing}
        onClose={() => {
          setIsEditing(false);
          setEditingParcel(null);
        }}
      >
        <DialogTitle>Edit Parcel</DialogTitle>
        <DialogContent>
          {editingParcel && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Recipient Name"
                    value={editingParcel.recipient}
                    onChange={(e) =>
                      setEditingParcel({
                        ...editingParcel,
                        recipient: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tracking Number"
                    value={editingParcel.trackingNumber}
                    disabled
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsEditing(false);
              setEditingParcel(null);
            }}
            sx={{ 
              color: "#d32f2f",
              "&:hover": { 
                backgroundColor: "rgba(137, 143, 99, 0.04)" 
              } 
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditParcel}
            variant="contained"
            disabled={loading}
            sx={{ 
              minWidth: '100px',
              backgroundColor: "#898F63",
              color: "white",
              "&:hover": { 
                backgroundColor: "#777c54" 
              },
            }}
          >
            {loading ? <LoadingSpinner /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleting}
        onClose={() => {
          setIsDeleting(false);
          setTrackingNumbersToDelete([]);
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the selected parcel?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsDeleting(false);
              setTrackingNumbersToDelete([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteParcels}
            color="error"
            variant="contained"
            disabled={loading}
            sx={{ minWidth: '100px' }}
          >
            {loading ? <LoadingSpinner  /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    

      {/* Empty state message when no parcels */}
      {filteredParcels.length === 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 1,
            mt: 2,
          }}
        >
          <Typography color="text.secondary">No parcels found</Typography>
        </Box>
      )}
    </Container>
  );
};

export default ParcelsPage;
