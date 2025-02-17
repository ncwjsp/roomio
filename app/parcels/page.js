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
  CircularProgress,
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
      console.log("Fetched buildings:", data); // Debug log

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

  const handleAddParcel = async () => {
    try {
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
        const error = await response.json();
        throw new Error(error.error || "Failed to add parcel");
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
        minHeight="80vh"
      >
        <CircularProgress />
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
          sx={{ fontWeight: "bold", color: "#333" }}
        >
          Parcels Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddForm(true)}
          sx={{
            backgroundColor: "#4CAF50",
            "&:hover": { backgroundColor: "#45a049" },
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
                            <CheckCircle />
                          ) : (
                            <LocalShipping />
                          )
                        }
                        onClick={() => handleToggleStatus(parcel)}
                        sx={{
                          backgroundColor:
                            parcel.status === "uncollected"
                              ? "#4CAF50"
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
                        startIcon={<Edit />}
                        onClick={() => handleEditClick(parcel)}
                        sx={{ backgroundColor: "#FFA000" }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteClick(parcel.trackingNumber)}
                        color="error"
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
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading rooms...
                        </div>
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
                      trackingNumber: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            onClick={handleAddParcel}
            variant="contained"
            disabled={
              !newParcel.room ||
              !newParcel.recipient ||
              !newParcel.trackingNumber
            }
            sx={{ backgroundColor: "#4CAF50" }}
          >
            Add Parcel
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
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditParcel}
            variant="contained"
            color="primary"
          >
            Save Changes
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
          >
            Delete
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
