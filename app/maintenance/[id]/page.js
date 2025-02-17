"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  Container,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  InputAdornment,
  CircularProgress
} from "@mui/material";
import {
  ArrowBack,
  Schedule as ScheduleIcon,
  Room as RoomIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';

export default function MaintenanceDetailPage({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [ticket, setTicket] = useState(null);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const id = use(params).id;
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date not available';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, "MMMM do, yyyy 'at' h:mm a");
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!session?.user?.id) return;

        // Fetch ticket details
        const ticketResponse = await fetch(`/api/maintenance/${id}`);
        if (!ticketResponse.ok) throw new Error("Failed to fetch ticket");
        const ticketData = await ticketResponse.json();
        setTicket(ticketData.ticket);

        // Fetch technicians
        const staffResponse = await fetch(
          `/api/staff/technician?landlordId=${session.user.id}`
        );
        if (!staffResponse.ok) throw new Error("Failed to fetch staff");
        const staffData = await staffResponse.json();
        setStaff(staffData.staff);
      } catch (error) {
        console.error("Error:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, id]);

  const handleAssignTechnician = async (technicianId) => {
    try {
      // Prevent assigning the same technician
      if (ticket.staff?._id === technicianId) {
        console.log("Technician is already assigned to this ticket");
        return;
      }

      const response = await fetch(`/api/maintenance/${ticket._id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ technicianId }),
      });

      if (!response.ok) throw new Error("Failed to assign technician");

      const updatedTicket = await response.json();
      setTicket(updatedTicket.ticket);
      
      // Refresh the ticket data to ensure consistency
      const ticketResponse = await fetch(`/api/maintenance/${id}`);
      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json();
        setTicket(ticketData.ticket);
      }
    } catch (error) {
      console.error("Error assigning technician:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "Completed":
        return "success";
      case "In Progress":
        return "info";
      case "Pending":
        return "warning";
      case "Cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const response = await fetch(`/api/maintenance/${ticket._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: newStatus,
          comment: statusComment 
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const updatedTicket = await response.json();
      setTicket(updatedTicket.ticket || updatedTicket);
      setShowStatusModal(false);
      setNewStatus("");
      setStatusComment("");
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Filter technicians based on search
  const filteredTechnicians = staff.filter((tech) =>
    `${tech.firstName} ${tech.lastName} ${tech.specialization}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

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

  if (!ticket) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography>Maintenance ticket not found</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ 
            mb: 3,
            color: '#889F63',
            '&:hover': {
              bgcolor: 'rgba(136, 159, 99, 0.08)',
            },
          }}
        >
          Back to Maintenance List
        </Button>

        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Header Section */}
          <Box mb={4}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="start"
              mb={3}
            >
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  fontWeight="bold"
                  color="text.primary"
                  gutterBottom
                >
                  {ticket.problem}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <RoomIcon sx={{ color: '#889F63' }} />
                  <Typography variant="subtitle1" color="text.secondary" component="div">
                    Room {ticket.room?.roomNumber}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={ticket.currentStatus}
                  color={getStatusColor(ticket.currentStatus)}
                  size="large"
                  sx={{ 
                    px: 2,
                    height: 32,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                />
                {!["Completed", "Cancelled"].includes(ticket.currentStatus) && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowStatusModal(true)}
                    sx={{
                      color: '#889F63',
                      borderColor: '#889F63',
                      '&:hover': {
                        borderColor: '#889F63',
                        bgcolor: 'rgba(136, 159, 99, 0.08)',
                      },
                    }}
                  >
                    Update Status
                  </Button>
                )}
              </Box>
            </Box>

            <Box 
              sx={{ 
                display: 'flex',
                gap: 4,
                p: 2,
                bgcolor: 'rgba(136, 159, 99, 0.08)',
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" component="div" gutterBottom>
                  Building
                </Typography>
                <Typography variant="body1" component="div" fontWeight="medium">
                  {ticket.room?.floor?.building?.name || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" component="div" gutterBottom>
                  Floor
                </Typography>
                <Typography variant="body1" component="div" fontWeight="medium">
                  {ticket.room?.floor?.floorNumber || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" component="div" gutterBottom>
                  Room
                </Typography>
                <Typography variant="body1" component="div" fontWeight="medium">
                  {ticket.room?.roomNumber || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" component="div" gutterBottom>
                  Created on
                </Typography>
                <Typography variant="body1" component="div" fontWeight="medium">
                  {formatDate(ticket.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Description Section */}
          <Box mb={4}>
            <Typography 
              variant="h6" 
              fontWeight="600" 
              mb={2}
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                color: '#889F63',
              }}
            >
              <DescriptionIcon sx={{ mr: 1 }} />
              Description
            </Typography>
            <Typography 
              color="text.secondary" 
              sx={{ 
                whiteSpace: "pre-line",
                bgcolor: '#f8f9fa',
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {ticket.description}
            </Typography>
          </Box>

          {/* Images Section */}
          {ticket.images?.length > 0 && (
            <Box mb={4}>
              <Typography 
                variant="h6" 
                fontWeight="600" 
                mb={2}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  color: '#889F63',
                }}
              >
                <ImageIcon sx={{ mr: 1 }} />
                Images
              </Typography>
              <Grid container spacing={2}>
                {ticket.images.map((image, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        position: "relative",
                        paddingTop: "75%",
                        overflow: "hidden",
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <img
                        src={image.url}
                        alt={`Maintenance image ${index + 1}`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Technician Assignment Section */}
          <Box mb={4}>
            <Typography 
              variant="h6" 
              fontWeight="600" 
              mb={2}
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                color: '#889F63',
              }}
            >
              <PersonIcon sx={{ mr: 1 }} />
              Assigned Technician
            </Typography>

            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {ticket.currentStatus !== "Completed" && (
                <Button
                  variant="contained"
                  onClick={() => setShowTechnicianModal(true)}
                  sx={{
                    bgcolor: "#889F63",
                    "&:hover": {
                      bgcolor: "#7A8F53",
                    },
                    px: 3,
                  }}
                >
                  {ticket.staff?._id ? "Change Technician" : "Assign Technician"}
                </Button>
              )}

              {ticket.staff?._id ? (
                <Box>
                  <Typography variant="subtitle1" component="div" fontWeight="medium">
                    {`${ticket.staff.firstName} ${ticket.staff.lastName}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="div">
                    {ticket.staff.specialization}
                  </Typography>
                </Box>
              ) : ticket.currentStatus !== "Completed" ? (
                <Typography color="text.secondary" fontStyle="italic" component="div">
                  No technician assigned
                </Typography>
              ) : null}
            </Box>
          </Box>

          {/* Status History Section */}
          <Box>
            <Typography 
              variant="h6" 
              fontWeight="600" 
              mb={2}
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                color: '#889F63',
              }}
            >
              <HistoryIcon sx={{ mr: 1 }} />
              Status History
            </Typography>
            <Timeline sx={{ p: 0, m: 0 }}>
              {(ticket.statusHistory || [])
                .slice()
                .reverse()
                .map((history, index) => (
                  <TimelineItem key={index} sx={{ minHeight: 'auto', '&:before': { display: 'none' } }}>
                    <TimelineSeparator>
                      <TimelineDot
                        sx={{
                          bgcolor:
                            history.status === "Completed"
                              ? "success.main"
                              : history.status === "In Progress"
                              ? "warning.main"
                              : history.status === "Cancelled"
                              ? "error.main"
                              : "info.main",
                          boxShadow: 'none',
                        }}
                      />
                      {index !== ticket.statusHistory.length - 1 && (
                        <TimelineConnector />
                      )}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="subtitle1" component="div">
                        {history.status}
                      </Typography>
                      {history.comment && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {history.comment}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {formatDate(history.updatedAt)}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
            </Timeline>
          </Box>
        </Paper>
      </Box>

      {/* Technician Selection Modal */}
      <Dialog
        open={showTechnicianModal}
        onClose={() => setShowTechnicianModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Technician</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            placeholder="Search technicians..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <List sx={{ pt: 0 }}>
            {filteredTechnicians.map((technician) => {
              const isCurrentTechnician = ticket.staff?._id === technician._id;
              return (
                <ListItem
                  component="div"
                  onClick={() => {
                    if (!isCurrentTechnician) {
                      handleAssignTechnician(technician._id);
                      setShowTechnicianModal(false);
                      setSearchQuery("");
                    }
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    cursor: isCurrentTechnician ? 'default' : 'pointer',
                    bgcolor: isCurrentTechnician
                      ? "rgba(136, 159, 99, 0.12)"
                      : "transparent",
                    "&:hover": {
                      bgcolor: isCurrentTechnician 
                        ? "rgba(136, 159, 99, 0.12)" 
                        : "action.hover",
                    },
                    opacity: isCurrentTechnician ? 0.7 : 1,
                  }}
                  key={technician._id}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#889F63" }}>
                      {technician.firstName[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {`${technician.firstName} ${technician.lastName}`}
                        {isCurrentTechnician && (
                          <Chip
                            label="Currently Assigned"
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(136, 159, 99, 0.2)',
                              color: '#889F63',
                              height: 24
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={technician.specialization}
                  />
                </ListItem>
              );
            })}
            {filteredTechnicians.length === 0 && (
              <Typography color="text.secondary" align="center" py={2}>
                No technicians found
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowTechnicianModal(false);
              setSearchQuery("");
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog
        open={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setNewStatus("");
          setStatusComment("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Status</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {["Pending", "In Progress", "Completed", "Cancelled"]
                .filter(status => status !== ticket.currentStatus) 
                .map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))
              }
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment (Optional)"
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowStatusModal(false);
              setNewStatus("");
              setStatusComment("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={!newStatus}
            sx={{
              bgcolor: "#889F63",
              "&:hover": {
                bgcolor: "#7A8F53",
              },
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
