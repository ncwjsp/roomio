"use client";

import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Alert,
  Paper,
  Grid,
  Typography,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Stack,
  FormHelperText
} from "@mui/material";

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

const ApartmentSettings = () => {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    waterRate: 0,
    electricityRate: 0,
    billingConfig: {
      dueDate: 5,
      latePaymentCharge: 0,
    }
  });
  const [billingCycle, setBillingCycle] = useState({
    startDate: 1,
    endDate: 28,
    dueDate: 5,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await fetch("/api/buildings");
      const data = await response.json();
      if (data.buildings) {
        setBuildings(data.buildings);
      }
    } catch (error) {
      setError("Failed to load buildings");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditBuilding = (building) => {
    setSelectedBuilding(building);
    setFormData({
      name: building.name || "",
      waterRate: building.waterRate || 0,
      electricityRate: building.electricityRate || 0,
      billingConfig: {
        dueDate: building.billingConfig?.dueDate || 5,
        latePaymentCharge: building.billingConfig?.latePaymentCharge || 0,
      }
    });
    setEditModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBuilding) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/buildings/${selectedBuilding._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          waterRate: formData.waterRate,
          electricityRate: formData.electricityRate,
          billingConfig: {
            dueDate: formData.billingConfig?.dueDate || 5,
            latePaymentCharge: formData.billingConfig?.latePaymentCharge || 0,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update building");
        return;
      }

      // Update rooms with new building name
      if (formData.name !== selectedBuilding.name) {
        const roomResponse = await fetch(`/api/buildings/${selectedBuilding._id}/rooms/update-names`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buildingName: formData.name }),
        });
        
        if (!roomResponse.ok) throw new Error("Failed to update room names");
      }

      // Update buildings list with new data
      setBuildings((prevBuildings) =>
        prevBuildings.map((b) =>
          b._id === selectedBuilding._id ? data.building : b
        )
      );

      setSelectedBuilding(null);
      setFormData({});
      setError(null);
      setSuccess(true);
      setEditModalOpen(false);
    } catch (error) {
      setError("Failed to update building");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "300px",
      }}>
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings updated successfully
        </Alert>
      )}

      {/* Building Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {buildings.map((building) => (
          <Grid item xs={12} key={building._id}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">{building.name}</Typography>
                <Button 
                  variant="contained" 
                  onClick={() => handleEditBuilding(building)}
                  sx={{ 
                    bgcolor: "#898F63",
                    "&:hover": { bgcolor: "#7C8F59" }
                  }}
                >
                  Edit
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography color="text.secondary">Water Rate</Typography>
                  <Typography>฿{building.waterRate}/unit</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography color="text.secondary">Electricity Rate</Typography>
                  <Typography>฿{building.electricityRate}/unit</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography color="text.secondary">Due Date</Typography>
                  <Typography>
                    {building.billingConfig?.dueDate}{building.billingConfig?.dueDate === 1 ? "st" : 
                    building.billingConfig?.dueDate === 2 ? "nd" : 
                    building.billingConfig?.dueDate === 3 ? "rd" : "th"} of next month
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>

     
      {/* Building Edit Dialog */}
      <Dialog 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ px: 3, pt: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            Edit Building
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Building Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., A"
              />
              <TextField
                label="Water Rate"
                type="number"
                fullWidth
                required
                value={formData.waterRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    waterRate: Number(e.target.value),
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">฿</InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">/unit</InputAdornment>
                  ),
                }}
                placeholder="e.g., 15"
              />
              <TextField
                label="Electricity Rate"
                type="number"
                fullWidth
                required
                value={formData.electricityRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    electricityRate: Number(e.target.value),
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">฿</InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">/unit</InputAdornment>
                  ),
                }}
                placeholder="e.g., 5"
              />
              <FormControl fullWidth>
                <InputLabel id="due-date-label">Due Date</InputLabel>
                <Select
                  labelId="due-date-label"
                  value={formData.billingConfig?.dueDate || 5}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingConfig: {
                      ...(formData.billingConfig || {}),
                      dueDate: Number(e.target.value)
                    }
                  })}
                  required
                  label="Due Date"
                >
                  {[...Array(15)].map((_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {i + 1}{i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} of next month
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Day of the next month when payment is due
                </FormHelperText>
              </FormControl>
              <TextField
                label="Late Payment Charge"
                type="number"
                fullWidth
                value={formData.billingConfig?.latePaymentCharge || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  billingConfig: {
                    ...(formData.billingConfig || {}),
                    latePaymentCharge: Number(e.target.value)
                  }
                })}
                required
                helperText="Fixed amount charged for late payments"
                inputProps={{ min: 0 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">฿</InputAdornment>
                  ),
                }}
                placeholder="e.g., 100"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{ 
                bgcolor: "#898F63",
                "&:hover": { bgcolor: "#7C8F59" }
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ApartmentSettings;
