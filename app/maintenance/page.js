"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  IconButton,
  CircularProgress,
  Container,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  InputAdornment,
  Stack,
} from "@mui/material";
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Room as RoomIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import Link from "next/link";

export default function MaintenancePage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState(null);
  const [filteredTickets, setFilteredTickets] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [staff, setStaff] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  // Get unique values for filters
  const buildings = tickets
    ? [...new Set(tickets
        .filter(t => t.room?.building?.name)
        .map(t => t.room.building.name))]
        .sort()
    : [];

  const floors = tickets
    ? [...new Set(tickets
        .filter(t => t.room?.floor?.floorNumber)
        .map(t => t.room.floor.floorNumber?.toString()))]
        .sort((a, b) => parseInt(a) - parseInt(b))
    : [];
  const statuses = ["Pending", "In Progress", "Completed"];

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!session?.user?.id) return;

        // Fetch tickets
        const ticketsResponse = await fetch(
          `/api/maintenance/user/${session.user.id}`
        );
        if (!ticketsResponse.ok) throw new Error("Failed to fetch tickets");
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData.tickets);

        // Fetch staff
        const staffResponse = await fetch(
          `/api/staff/technician?landlordId=${session.user.id}`
        );
        if (!staffResponse.ok) throw new Error("Failed to fetch staff");
        const staffData = await staffResponse.json();
        setStaff(staffData.staff);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session]);

  useEffect(() => {
    if (!tickets) return;

    let filtered = [...tickets];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (ticket) =>
          ticket.currentStatus.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply building filter
    if (buildingFilter !== "all") {
      filtered = filtered.filter(
        (ticket) => ticket.room?.building?.name === buildingFilter
      );
    }

    // Apply floor filter
    if (floorFilter !== "all") {
      filtered = filtered.filter(
        (ticket) => ticket.room?.floor?.floorNumber?.toString() === floorFilter
      );
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.problem.toLowerCase().includes(query) ||
          ticket.room?.building?.name?.toLowerCase().includes(query) ||
          ticket.room?.floor?.floorNumber?.toString().includes(query) ||
          ticket.room?.roomNumber?.toLowerCase().includes(query)
      );
    }

    const sortedTickets = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredTickets(sortedTickets);
  }, [tickets, statusFilter, buildingFilter, floorFilter, searchQuery, sortOrder]);

  const handleAssignTechnician = async (ticketId, technicianId) => {
    try {
      const response = await fetch(`/api/maintenance/${ticketId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ technicianId }),
      });

      if (!response.ok) throw new Error("Failed to assign technician");

      // Refresh tickets after assignment
      const updatedTickets = await fetch(
        `/api/maintenance/user/${session.user.id}`
      );
      const data = await updatedTickets.json();
      setTickets(data.tickets);

      // Update selected ticket
      setSelectedTicket(data.tickets.find((t) => t._id === ticketId));
    } catch (error) {
      console.error("Error assigning technician:", error);
      // Add error handling UI here
    }
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "Completed":
        return "success";
      case "In Progress":
        return "info";
      case "Pending":
        return "warning";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress sx={{ color: "#889F63" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          color="text.primary"
        >
          Maintenance Tickets
        </Typography>
        
      </Box>

      {/* Filters */}
      <Box
        sx={{
          mb: 4,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search tickets"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by problem, building, floor..."
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="all">All</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Building</InputLabel>
              <Select 
                value={buildingFilter} 
                onChange={(e) => setBuildingFilter(e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="all">All Buildings</MenuItem>
                {buildings.map((building) => (
                  <MenuItem key={building} value={building}>
                    {building}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Floor</InputLabel>
              <Select 
                value={floorFilter} 
                onChange={(e) => setFloorFilter(e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="all">All Floors</MenuItem>
                {floors.map((floor) => (
                  <MenuItem key={floor} value={floor}>
                    Floor {floor}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort by Date</InputLabel>
              <Select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="desc">Newest First</MenuItem>
                <MenuItem value="asc">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Loading State */}
      {isLoading ? (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="200px"
        >
          <Typography color="error">{error}</Typography>
        </Box>
      ) : filteredTickets?.length === 0 ? (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="200px"
        >
          <Typography color="text.secondary">No maintenance tickets found</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {(filteredTickets || []).map((ticket) => (
            <Grid item xs={12} sm={6} md={4} key={ticket._id}>
              <Link
                href={`/maintenance/${ticket._id}`}
                style={{ textDecoration: "none" }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      borderColor: "#889F63",
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1, p: 3 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="start"
                      mb={2}
                    >
                      <Typography
                        variant="h6"
                        component="span"
                        fontWeight="medium"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {ticket.problem}
                      </Typography>
                      <Chip
                        label={ticket.currentStatus}
                        color={getStatusColor(ticket.currentStatus)}
                        size="small"
                        sx={{
                          ml: 1,
                          minWidth: 90,
                        }}
                      />
                    </Box>

                    <Stack spacing={1.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <RoomIcon sx={{ color: "#889F63", fontSize: 20 }} />
                        <Typography variant="body2" component="span">
                          Building {ticket.room?.building?.name || '?'}, Floor {ticket.room?.floor?.floorNumber || '?'}, Room {ticket.room?.roomNumber || '?'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(ticket.createdAt)}
                        </Typography>
                      </Box>
                      
                    </Stack>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
