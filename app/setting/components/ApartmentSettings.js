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
  CircularProgress,
  Box,
} from "@mui/material";

const ApartmentSettings = () => {
  const [settings, setSettings] = useState({
    utilities: {
      water: {
        pricePerUnit: "",
        unit: "cubic meter",
      },
      electricity: {
        pricePerUnit: "",
        unit: "kWh",
      },
      billingCycleDate: "",
      latePaymentFee: "",
      selectedBuilding: "",
    },
    commonFees: {
      basePrice: "",
      cleaningFee: "",
      securityFee: "",
      parkingFee: "",
    },
    lateFees: {
      percentage: "",
      gracePeriod: "", // days
      maxAmount: "",
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [billingCycle, setBillingCycle] = useState({
    startDate: 1,
    endDate: 28,
    dueDate: 5,
  });

  useEffect(() => {
    fetchSettings();
    fetchBuildings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/billing");
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      setError("Failed to load billing settings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await fetch("/api/buildings");
      const data = await response.json();
      if (data.buildings) {
        setBuildings(data.buildings);
      }
    } catch (error) {
      setError("Failed to load buildings");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/settings/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) throw new Error("Failed to update settings");
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
          width: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Building-specific Utility Settings */}
      <Paper className="p-6">
        <Typography variant="h6" className="mb-4">
          Building Utility Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Building</InputLabel>
              <Select
                value={settings.utilities.selectedBuilding}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    utilities: {
                      ...settings.utilities,
                      selectedBuilding: e.target.value,
                    },
                  })
                }
              >
                {buildings.map((building) => (
                  <MenuItem key={building.id} value={building.id}>
                    {building.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Billing Cycle Date"
              type="number"
              value={settings.utilities.billingCycleDate}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  utilities: {
                    ...settings.utilities,
                    billingCycleDate: e.target.value,
                  },
                })
              }
              InputProps={{
                inputProps: { min: 1, max: 31 },
                endAdornment: (
                  <InputAdornment position="end">of month</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Late Payment Fee"
              type="number"
              value={settings.utilities.latePaymentFee}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  utilities: {
                    ...settings.utilities,
                    latePaymentFee: e.target.value,
                  },
                })
              }
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Utility Rates */}
      <Paper className="p-6">
        <Typography variant="h6" className="mb-4">
          Utility Rates
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Water Rate"
              type="number"
              value={settings.utilities.water.pricePerUnit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  utilities: {
                    ...settings.utilities,
                    water: {
                      ...settings.utilities.water,
                      pricePerUnit: e.target.value,
                    },
                  },
                })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">฿</InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">/m³</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Electricity Rate"
              type="number"
              value={settings.utilities.electricity.pricePerUnit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  utilities: {
                    ...settings.utilities,
                    electricity: {
                      ...settings.utilities.electricity,
                      pricePerUnit: e.target.value,
                    },
                  },
                })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">฿</InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">/kWh</InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper className="p-6">
        <Typography variant="h6" className="mb-4">
          Billing Cycle Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Billing Start Date</InputLabel>
              <Select
                value={billingCycle.startDate}
                onChange={(e) =>
                  setBillingCycle({
                    ...billingCycle,
                    startDate: e.target.value,
                  })
                }
                label="Billing Start Date"
              >
                {Array.from({ length: 28 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Billing End Date</InputLabel>
              <Select
                value={billingCycle.endDate}
                onChange={(e) =>
                  setBillingCycle({ ...billingCycle, endDate: e.target.value })
                }
                label="Billing End Date"
              >
                {Array.from({ length: 28 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Due Date</InputLabel>
              <Select
                value={billingCycle.dueDate}
                onChange={(e) =>
                  setBillingCycle({ ...billingCycle, dueDate: e.target.value })
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
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {success && (
        <Alert severity="success">Settings updated successfully</Alert>
      )}

      <Button type="submit" variant="contained" color="primary" size="large">
        Save All Settings
      </Button>
    </form>
  );
};

export default ApartmentSettings;
