"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  IconButton,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";

export default function TenantDetails({ params }) {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const tenantId = use(params).id;

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

      setTenant(data.tenant);
    } catch (error) {
      console.error("Error fetching tenant:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/tenant/${tenantId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete tenant");
      }

      router.push("/tenants");
    } catch (error) {
      console.error("Error deleting tenant:", error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={400} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!tenant) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Tenant not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <IconButton onClick={() => router.push("/tenants")} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              {tenant.name}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <HomeIcon sx={{ mr: 2, color: "primary.main" }} />
                <Typography>
                  <strong>Room:</strong> {tenant.room.roomNumber}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PersonIcon sx={{ mr: 2, color: "primary.main" }} />
                <Typography>
                  <strong>Line ID:</strong> {tenant.lineId}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PhoneIcon sx={{ mr: 2, color: "primary.main" }} />
                <Typography>
                  <strong>Tel:</strong> {tenant.phone}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <EmailIcon sx={{ mr: 2, color: "primary.main" }} />
                <Typography>
                  <strong>Email:</strong> {tenant.email}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CalendarIcon sx={{ mr: 2, color: "primary.main" }} />
                <Typography>
                  <strong>Lease Period:</strong>{" "}
                  {new Date(tenant.leaseStartDate).toLocaleDateString()} -{" "}
                  {new Date(tenant.leaseEndDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <MoneyIcon sx={{ mr: 2, color: "primary.main" }} />
                <Typography>
                  <strong>Deposit Amount:</strong> ฿{tenant.depositAmount}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
            <Link href={`/tenants/${tenant._id}/edit`} passHref>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
            </Link>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this tenant? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
