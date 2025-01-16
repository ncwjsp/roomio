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
} from "@mui/material";
import {
  LocalShipping,
  Edit,
  Delete,
  CheckCircle,
  Add as AddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

const ParcelsPage = () => {
  const [parcels, setParcels] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [buildings, setBuildings] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParcel, setNewParcel] = useState({
    roomNo: "",
    name: "",
    trackingNumber: "",
    building: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingParcel, setEditingParcel] = useState(null);
  const [trackingNumbersToDelete, setTrackingNumbersToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch parcels
  useEffect(() => {
    fetch("/api/parcels")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch parcels");
        return res.json();
      })
      .then((data) => {
        setParcels(data);
        setFilteredParcels(data);
        // Extract unique buildings
        const uniqueBuildings = [...new Set(data.map((p) => p.building))];
        setBuildings(uniqueBuildings);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching parcels:", error);
        setLoading(false);
      });
  }, []);

  // Filter parcels
  useEffect(() => {
    let result = parcels;

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (parcel) =>
          parcel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          parcel.roomNo.toString().includes(searchQuery) ||
          parcel.trackingNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Filter by building
    if (selectedBuilding !== "all") {
      result = result.filter((parcel) => parcel.building === selectedBuilding);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      result = result.filter((parcel) => parcel.status === selectedStatus);
    }

    setFilteredParcels(result);
  }, [searchQuery, selectedBuilding, selectedStatus, parcels]);

  const handleAddParcel = () => {
    fetch("/api/parcels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newParcel),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add parcel");
        return res.json();
      })
      .then((data) => {
        setParcels((prev) => [...prev, data]);
        setNewParcel({
          roomNo: "",
          name: "",
          trackingNumber: "",
          building: "",
        });
        setShowAddForm(false);
      })
      .catch((error) => console.error("Error adding parcel:", error));
  };

  const handleEditParcel = () => {
    fetch("/api/parcels", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingNumber: editingParcel.trackingNumber,
        updates: editingParcel,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to edit parcel");
        }
        return res.json();
      })
      .then((updatedParcel) =>
        setParcels((prev) =>
          prev.map((parcel) =>
            parcel.trackingNumber === updatedParcel.trackingNumber
              ? updatedParcel
              : parcel
          )
        )
      )
      .finally(() => {
        setIsEditing(false);
        setEditingParcel(null);
      })
      .catch((error) => console.error("Error editing parcel:", error));
  };

  const handleMarkAsCollected = (trackingNumber) => {
    fetch("/api/parcels", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingNumber,
        updates: { status: "collected" },
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
          prev.map((parcel) =>
            parcel.trackingNumber === updatedParcel.trackingNumber
              ? updatedParcel
              : parcel
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
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            label="Building"
          >
            <MenuItem value="all">All Buildings</MenuItem>
            {buildings.map((building) => (
              <MenuItem key={building} value={building}>
                {building}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="haven't collected">Not Collected</MenuItem>
            <MenuItem value="collected">Collected</MenuItem>
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
            {filteredParcels.map((parcel) => (
              <TableRow key={parcel.trackingNumber}>
                <TableCell>{parcel.roomNo}</TableCell>
                <TableCell>{parcel.building}</TableCell>
                <TableCell>{parcel.name}</TableCell>
                <TableCell>{parcel.trackingNumber}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      parcel.status === "haven't collected"
                        ? "Not Collected"
                        : "Collected"
                    }
                    color={
                      parcel.status === "haven't collected"
                        ? "error"
                        : "success"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    {parcel.status === "haven't collected" && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircle />}
                        onClick={() =>
                          handleMarkAsCollected(parcel.trackingNumber)
                        }
                        sx={{ backgroundColor: "#4CAF50" }}
                      >
                        Collect
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={() => {
                        setIsEditing(true);
                        setEditingParcel(parcel);
                      }}
                      sx={{ backgroundColor: "#FFA000" }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Delete />}
                      onClick={() =>
                        setTrackingNumbersToDelete([parcel.trackingNumber])
                      }
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
      </TableContainer>

      {/* Add Parcel Dialog */}
      <Dialog
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Parcel</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Room No"
                  value={newParcel.roomNo}
                  onChange={(e) =>
                    setNewParcel({ ...newParcel, roomNo: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Building"
                  value={newParcel.building}
                  onChange={(e) =>
                    setNewParcel({ ...newParcel, building: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipient Name"
                  value={newParcel.name}
                  onChange={(e) =>
                    setNewParcel({ ...newParcel, name: e.target.value })
                  }
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
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddForm(false)}>Cancel</Button>
          <Button
            onClick={handleAddParcel}
            variant="contained"
            sx={{ backgroundColor: "#4CAF50" }}
          >
            Add Parcel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onClose={() => setIsDeleting(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the selected parcels?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleting(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteParcels}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ParcelsPage;
