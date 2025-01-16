"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  IconButton,
  Alert,
  Skeleton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import Providers from "@/app/components/Providers";

export default function EditTenant({ params }) {
  const router = useRouter();
  const tenantId = use(params).id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenantData, setTenantData] = useState({
    name: "",
    email: "",
    phone: "",
    lineId: "",
    depositAmount: "",
    leaseStartDate: null,
    leaseEndDate: null,
    room: "",
  });

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    try {
      const response = await fetch(`/api/tenant/${tenantId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tenant");
      }

      setTenantData({
        name: data.tenant.name,
        email: data.tenant.email,
        phone: data.tenant.phone,
        lineId: data.tenant.lineId,
        depositAmount: data.tenant.depositAmount,
        leaseStartDate: dayjs(data.tenant.leaseStartDate),
        leaseEndDate: dayjs(data.tenant.leaseEndDate),
        room: data.tenant.room._id,
      });
    } catch (error) {
      console.error("Error fetching tenant:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`/api/tenant/${tenantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...tenantData,
          leaseStartDate: tenantData.leaseStartDate.toISOString(),
          leaseEndDate: tenantData.leaseEndDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update tenant");
      }

      router.push(`/tenants/${tenantId}`);
    } catch (error) {
      console.error("Error updating tenant:", error);
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTenantData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <Providers>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="rectangular" height={400} />
        </Container>
      </Providers>
    );
  }

  return (
    <Providers>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card elevation={3}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" component="h1">
                Edit Tenant
              </Typography>
            </Box>

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
                    label="Name"
                    name="name"
                    value={tenantData.name}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={tenantData.email}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={tenantData.phone}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Line ID"
                    name="lineId"
                    value={tenantData.lineId}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Deposit Amount"
                    name="depositAmount"
                    type="number"
                    value={tenantData.depositAmount}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                  />
                  <DatePicker
                    label="Lease Start Date"
                    value={tenantData.leaseStartDate}
                    onChange={(newValue) =>
                      setTenantData((prev) => ({
                        ...prev,
                        leaseStartDate: newValue,
                      }))
                    }
                    sx={{ mb: 2, width: "100%" }}
                  />
                  <DatePicker
                    label="Lease End Date"
                    value={tenantData.leaseEndDate}
                    onChange={(newValue) =>
                      setTenantData((prev) => ({
                        ...prev,
                        leaseEndDate: newValue,
                      }))
                    }
                    sx={{ width: "100%" }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  Update Tenant
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  size="large"
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Providers>
  );
}
