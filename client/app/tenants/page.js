"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Container,
  Grid,
  Box,
  Chip,
  Avatar,
  IconButton,
  Pagination,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";

const Tenants = () => {
  const router = useRouter();
  const TENANTS_PER_PAGE = 12;
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/tenant");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tenants");
      }

      setTenants(data.tenants);
      setFilteredTenants(data.tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = tenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(query.toLowerCase()) ||
        tenant.room.roomNumber.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTenants(filtered);
    setCurrentPage(1);
  };

  const handleTenantClick = (tenantId) => {
    router.push(`/tenants/${tenantId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const totalPages = Math.ceil(filteredTenants.length / TENANTS_PER_PAGE);
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * TENANTS_PER_PAGE,
    currentPage * TENANTS_PER_PAGE
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 4,
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          Tenant Management
        </Typography>
        <Link href="/tenants/add" passHref>
          <Button variant="contained" color="primary">
            Add New Tenant
          </Button>
        </Link>
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by Tenant Name or Room"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
            ),
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {paginatedTenants.map((tenant) => (
          <Grid item xs={12} sm={6} md={4} key={tenant._id}>
            <Card
              elevation={2}
              sx={{
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 8,
                },
              }}
              onClick={() => handleTenantClick(tenant._id)}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                    {tenant.name[0]}
                  </Avatar>
                  <Typography variant="h6" component="h2">
                    {tenant.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Chip
                    icon={<HomeIcon />}
                    label={`Room ${tenant.room.roomNumber}`}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    <PhoneIcon
                      sx={{ fontSize: 16, mr: 1, verticalAlign: "middle" }}
                    />
                    {tenant.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <PersonIcon
                      sx={{ fontSize: 16, mr: 1, verticalAlign: "middle" }}
                    />
                    {tenant.lineId}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
};

export default Tenants;
