"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import AdditionalFeesField from "@/app/ui/bills/AdditionalFeesField";
import { format } from "date-fns";

const EditBillPage = () => {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentReadings, setCurrentReadings] = useState(null);
  const [formData, setFormData] = useState({
    waterUsage: "",
    electricityUsage: "",
    additionalFees: [],
    notes: "",
    isFullRent: true,
  });
  const [meterReadings, setMeterReadings] = useState({
    water: 0,
    electricity: 0,
  });

  useEffect(() => {
    fetchBill();
  }, [params.billId]);

  const fetchBill = async () => {
    try {
      const response = await fetch(`/api/bills/${params.billId}`);
      const data = await response.json();
      setBill(data);

      const roomResponse = await fetch(`/api/room/${data.roomId._id}`);
      const roomData = await roomResponse.json();
      setCurrentReadings(roomData.currentMeterReadings);

      // Initialize meter readings with current values
      setMeterReadings({
        water:
          (roomData.currentMeterReadings?.water || 0) + (data.waterUsage || 0),
        electricity:
          (roomData.currentMeterReadings?.electricity || 0) +
          (data.electricityUsage || 0),
      });

      setFormData({
        waterUsage: data.waterUsage || 0,
        electricityUsage: data.electricityUsage || 0,
        additionalFees: data.additionalFees || [],
        notes: data.notes || "",
        isFullRent: data.actualRentAmount === data.rentAmount,
      });
      setLoading(false);
    } catch (error) {
      setError("Failed to fetch data");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  const calculateProRatedRent = (rentAmount, leaseStartDate) => {
    if (!leaseStartDate) return rentAmount;

    try {
      const billingCycleDate = new Date(bill.month);
      billingCycleDate.setDate(25);

      const daysInMonth = new Date(
        billingCycleDate.getFullYear(),
        billingCycleDate.getMonth() + 1,
        0
      ).getDate();

      const moveInDate = new Date(leaseStartDate);
      const nextBillingDate = new Date(billingCycleDate);
      nextBillingDate.setMonth(billingCycleDate.getMonth() + 1);

      const daysStayed = Math.ceil(
        (nextBillingDate - moveInDate) / (1000 * 60 * 60 * 24)
      );

      const proRatedAmount = Math.round(
        (rentAmount / daysInMonth) * daysStayed
      );


      return proRatedAmount;
    } catch (error) {
      console.error("Error calculating pro-rated rent:", error);
      return rentAmount;
    }
  };

  const calculateUsage = (current, previous) => {
    return Math.max(0, current - previous);
  };

  const handleMeterChange = (type, value) => {
    // Allow empty string or valid numbers
    const newValue = value === "" ? "" : parseFloat(value);
    const previousReading = currentReadings?.[type] || 0;

    setMeterReadings((prev) => ({
      ...prev,
      [type]: value, // Store the raw value, not parsed
    }));

    // Only calculate usage if we have a valid number
    const usage = !isNaN(newValue)
      ? Math.max(0, newValue - previousReading)
      : 0;

    setFormData((prev) => ({
      ...prev,
      [`${type}Usage`]: usage,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use the meter readings directly for usage calculation
      const waterUsage = Math.max(
        0,
        meterReadings.water - (currentReadings?.water || 0)
      );
      const electricityUsage = Math.max(
        0,
        meterReadings.electricity - (currentReadings?.electricity || 0)
      );

      console.log("Submitting usage:", {
        currentReadings,
        meterReadings,
        calculatedUsage: {
          water: waterUsage,
          electricity: electricityUsage,
        },
      });

      const finalRentAmount = formData.isFullRent
        ? bill.rentAmount
        : calculateProRatedRent(
            bill.rentAmount,
            bill.roomId.tenant?.leaseStartDate
          );

      const response = await fetch(`/api/bills/${params.billId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          waterUsage, // Use calculated usage
          electricityUsage, // Use calculated usage
          waterRate: bill.waterRate,
          electricityRate: bill.electricityRate,
          actualRentAmount: finalRentAmount,
          status: "completed",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update bill");
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/billings");
      }, 1000);
    } catch (error) {
      console.error("Error updating bill:", error);
      setError(error.message);
    }
  };

  if (loading) return <CircularProgress />;
  if (!bill) return <Typography>Bill not found</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Edit Bill - Room {bill?.roomId?.roomNumber || "Loading..."}
        </Typography>

        {currentReadings && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Previous readings - Water: {currentReadings.water} m³, Electricity:{" "}
            {currentReadings.electricity} kWh
            {currentReadings.lastUpdated &&
              ` (Last updated: ${new Date(
                currentReadings.lastUpdated
              ).toLocaleDateString()})`}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Bill updated successfully
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Water Reading"
                type="number"
                value={meterReadings.water}
                onChange={(e) => handleMeterChange("water", e.target.value)}
                required
                helperText={`Usage: ${formData.waterUsage} units`}
                InputProps={{
                  inputProps: {
                    min: 0,
                    step: "any",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Electricity Reading"
                type="number"
                value={meterReadings.electricity}
                onChange={(e) =>
                  handleMeterChange("electricity", e.target.value)
                }
                required
                helperText={`Usage: ${formData.electricityUsage} units`}
                InputProps={{
                  inputProps: {
                    min: 0,
                    step: "any",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <AdditionalFeesField
                value={formData.additionalFees}
                onChange={(newFees) =>
                  setFormData((prev) => ({ ...prev, additionalFees: newFees }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Rent Calculation</FormLabel>
                <RadioGroup
                  row
                  value={formData.isFullRent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isFullRent: e.target.value === "true",
                    })
                  }
                >
                  <FormControlLabel
                    value={true}
                    control={<Radio />}
                    label="Full Month Rent"
                  />
                  <FormControlLabel
                    value={false}
                    control={<Radio />}
                    label="Pro-rated (Based on Move-in Date)"
                  />
                </RadioGroup>
              </FormControl>
              {!formData.isFullRent && bill.roomId?.tenant?.leaseStartDate && (
                <Typography variant="caption" color="text.secondary">
                  Pro-rated amount will be calculated based on actual days from
                  move-in date ({formatDate(bill.roomId.tenant.leaseStartDate)})
                </Typography>
              )}
            </Grid>
          </Grid>

          <Box
            sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}
          >
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => router.push("/billings")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#898f63",
                "&:hover": { bgcolor: "#707454" },
              }}
            >
              Save Bill
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default EditBillPage;