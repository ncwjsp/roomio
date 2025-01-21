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

  useEffect(() => {
    fetchSettings();
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Common Fees */}
      <Paper className="p-6">
        <Typography variant="h6" className="mb-4">
          Common Fees
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Base Common Fee"
              type="number"
              value={settings.commonFees.basePrice}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  commonFees: {
                    ...settings.commonFees,
                    basePrice: e.target.value,
                  },
                })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">฿</InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">/month</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cleaning Fee"
              type="number"
              value={settings.commonFees.cleaningFee}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  commonFees: {
                    ...settings.commonFees,
                    cleaningFee: e.target.value,
                  },
                })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">฿</InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">/month</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Security Fee"
              type="number"
              value={settings.commonFees.securityFee}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  commonFees: {
                    ...settings.commonFees,
                    securityFee: e.target.value,
                  },
                })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">฿</InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">/month</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Parking Fee"
              type="number"
              value={settings.commonFees.parkingFee}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  commonFees: {
                    ...settings.commonFees,
                    parkingFee: e.target.value,
                  },
                })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">฿</InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">/month</InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Late Payment Settings */}
      <Paper className="p-6">
        <Typography variant="h6" className="mb-4">
          Late Payment Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Late Fee Percentage"
              type="number"
              value={settings.lateFees.percentage}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  lateFees: {
                    ...settings.lateFees,
                    percentage: e.target.value,
                  },
                })
              }
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Grace Period"
              type="number"
              value={settings.lateFees.gracePeriod}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  lateFees: {
                    ...settings.lateFees,
                    gracePeriod: e.target.value,
                  },
                })
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">days</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Maximum Late Fee"
              type="number"
              value={settings.lateFees.maxAmount}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  lateFees: {
                    ...settings.lateFees,
                    maxAmount: e.target.value,
                  },
                })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">฿</InputAdornment>
                ),
              }}
            />
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
