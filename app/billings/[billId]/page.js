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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import AdditionalFeesField from "@/app/ui/bills/AdditionalFeesField";
import { format } from "date-fns";

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
              animationDelay: `${-0.0833 * (12 - i)}s`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes spinner-fade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

const EditBillPage = () => {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentReadings, setCurrentReadings] = useState(null);
  const [rentAmount, setRentAmount] = useState(0);
  const [rentType, setRentType] = useState("full");
  const [waterUsage, setWaterUsage] = useState(0);
  const [electricityUsage, setElectricityUsage] = useState(0);
  const [waterRate, setWaterRate] = useState(0);
  const [electricityRate, setElectricityRate] = useState(0);
  const [additionalFees, setAdditionalFees] = useState([]);
  const [notes, setNotes] = useState("");
  const [meterReadings, setMeterReadings] = useState({
    water: 0,
    electricity: 0,
  });

  useEffect(() => {
    fetchBill();
  }, [params.billId]);

  useEffect(() => {
    if (bill) {
      // Check if using custom rent amount
      const isCustomRent = bill.rentAmount !== bill.roomId.price;
      setRentType(isCustomRent ? "custom" : "full");
      setRentAmount(bill.rentAmount || 0);

      setWaterUsage(bill.waterUsage || 0);
      setElectricityUsage(bill.electricityUsage || 0);
      setWaterRate(bill.waterRate || 0);
      setElectricityRate(bill.electricityRate || 0);
      setAdditionalFees(bill.additionalFees || []);
      setNotes(bill.notes || "");
    }
  }, [bill]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bills/${params.billId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch bill");
      }
      const data = await response.json();
      console.log("Fetched bill:", data);
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

      setLoading(false);
    } catch (error) {
      console.error("Error fetching bill:", error);
      setError(error.message);
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

    if (type === "water") {
      setWaterUsage(usage);
    } else {
      setElectricityUsage(usage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Log form data before submission
      const formData = {
        rentAmount: parseFloat(rentAmount),
        waterUsage: parseFloat(waterUsage || 0),
        electricityUsage: parseFloat(electricityUsage || 0),
        waterRate: parseFloat(waterRate || 0),
        electricityRate: parseFloat(electricityRate || 0),
        additionalFees,
        notes,
        currentMeterReadings: {
          water: parseFloat(waterUsage || 0),
          electricity: parseFloat(electricityUsage || 0),
          lastUpdated: new Date(),
        },
      };
      console.log("Submitting form data:", formData);

      const response = await fetch(`/api/bills/${params.billId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to update bill");
      }

      setSuccess("Bill updated successfully!");
      setLoading(false);
      setTimeout(() => {
        router.push("/billings");
      }, 1000);
    } catch (error) {
      console.error("Error updating bill:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
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
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Rent Amount */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Rent Amount</FormLabel>
                <RadioGroup
                  row
                  value={rentType}
                  onChange={(e) => {
                    setRentType(e.target.value);
                    if (e.target.value === "full") {
                      setRentAmount(bill?.roomId?.price || 0);
                    }
                  }}
                >
                  <FormControlLabel
                    value="full"
                    control={<Radio />}
                    label="Full Month Rent"
                  />
                  <FormControlLabel
                    value="custom"
                    control={<Radio />}
                    label="Custom Rent Amount"
                  />
                </RadioGroup>
              </FormControl>
              {rentType === "custom" && (
                <TextField
                  fullWidth
                  label="Custom Rent Amount"
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  required
                  sx={{ mt: 2 }}
                  InputProps={{
                    inputProps: {
                      min: 0,
                      step: "any",
                    },
                  }}
                />
              )}
            </Grid>

            {/* Meter Readings */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Water Reading"
                type="number"
                value={meterReadings.water}
                onChange={(e) => handleMeterChange("water", e.target.value)}
                required
                helperText={`Usage: ${waterUsage} units`}
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
                helperText={`Usage: ${electricityUsage} units`}
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
                value={additionalFees}
                onChange={(newFees) => setAdditionalFees(newFees)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
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
