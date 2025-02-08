"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Skeleton,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

export default function TenantsPage() {
  const { data: session, status } = useSession();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      fetchTenants();
    }
  }, [session]);

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/tenant");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tenants");
      }

      // Remove the filter here since we're already filtering in the API
      setTenants(data.tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, show login message
  if (status === "unauthenticated") {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Please log in to view your tenants.</Alert>
      </Container>
    );
  }

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRemainingDays = (endDate) => {
    if (!endDate) return 0;
    const end = dayjs(endDate);
    const now = dayjs();
    const days = end.diff(now, "day");
    return days >= 0 ? days : 0;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton
                variant="rectangular"
                height={200}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
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

  const columns = [
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar src={params.row.pfp} alt={params.row.name}>
            <PersonIcon />
          </Avatar>
          <Typography>{params.row.name}</Typography>
        </Box>
      ),
    },
    // ... other columns
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
          Tenants
        </Typography>
        <Link href="/tenants/add" passHref>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            Add New Tenant
          </Button>
        </Link>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search tenants by name or room number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          mb: 4,
          backgroundColor: "background.paper",
          borderRadius: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {/* Tenants Grid */}
      <Grid container spacing={3}>
        {filteredTenants.map((tenant) => (
          <Grid item xs={12} md={6} lg={4} key={tenant._id}>
            <Card
              elevation={1}
              sx={{
                borderRadius: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      width: 56,
                      height: 56,
                      mr: 2,
                    }}
                  >
                    {getInitials(tenant.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {tenant.name}
                    </Typography>
                    <Chip
                      icon={<HomeIcon sx={{ fontSize: 16 }} />}
                      label={`Building ${tenant.room.floor.building.name} - ${tenant.room.roomNumber}`}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    <CalendarIcon
                      sx={{ fontSize: 16, mr: 1, verticalAlign: "text-bottom" }}
                    />
                    Lease: {formatDate(tenant.leaseStartDate)} -{" "}
                    {formatDate(tenant.leaseEndDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <ScheduleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    {"    "}
                    {getRemainingDays(tenant.leaseEndDate)} days remaining
                  </Typography>
                </Box>

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
                >
                  <Link href={`/tenants/${tenant._id}`} passHref>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ borderRadius: 1.5, textTransform: "none" }}
                    >
                      View Details
                    </Button>
                  </Link>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
