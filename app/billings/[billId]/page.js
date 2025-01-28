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
} from "@mui/material";
import AdditionalFeesField from "@/app/ui/bills/AdditionalFeesField";

const EditBillPage = () => {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    waterUsage: "",
    electricityUsage: "",
    additionalFees: [],
    notes: "",
  });

  useEffect(() => {
    fetchBill();
  }, [params.billId]);

  const fetchBill = async () => {
    try {
      const response = await fetch(`/api/bills/${params.billId}`);
      const data = await response.json();
      setBill(data);
      setFormData({
        waterUsage: data.waterUsage?.toString() || "",
        electricityUsage: data.electricityUsage?.toString() || "",
        additionalFees: data.additionalFees || [],
        notes: data.notes || "",
      });
      setLoading(false);
    } catch (error) {
      setError("Failed to fetch bill");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/bills/${params.billId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update bill");
      }

      router.push("/billings");
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <CircularProgress />;
  if (!bill) return <Typography>Bill not found</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Edit Bill - Room {bill.roomNumber}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Water Usage (units)"
                type="number"
                value={formData.waterUsage}
                onChange={(e) =>
                  setFormData({ ...formData, waterUsage: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Electricity Usage (units)"
                type="number"
                value={formData.electricityUsage}
                onChange={(e) =>
                  setFormData({ ...formData, electricityUsage: e.target.value })
                }
                required
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
          </Grid>

          <Box
            sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}
          >
            <Button variant="outlined" onClick={() => router.push("/billings")}>
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
