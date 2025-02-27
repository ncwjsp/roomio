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
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { getStatusColor, buttonStyles, chipStyles, modalStyles, colors } from "@/lib/styles";

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
              animationDelay: `${-0.0833 * (12 - i)}s`
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes spinner-fade {
          0% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
};

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
  const [isAssigning, setIsAssigning] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(null);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date not available';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, "MMMM do, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Error formatting date';
    }
  };

  const formatDateWithTime = (dateString) => {
    try {
      if (!dateString) return 'Date not available';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, "MMMM do, yyyy 'at' h:mm a");
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Error formatting date';
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
    if (!scheduledDate) {
      alert("Please select a date for the maintenance work");
      return;
    }

    try {
      setIsAssigning(true);
      const response = await fetch(`/api/maintenance/${id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          technicianId,
          scheduledDate: scheduledDate.toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign technician");
      }

      // Refresh ticket data
      const ticketResponse = await fetch(`/api/maintenance/${id}`);
      if (!ticketResponse.ok) throw new Error("Failed to fetch ticket");
      const ticketData = await ticketResponse.json();
      setTicket(ticketData.ticket);
      
      setShowTechnicianModal(false);
      setSearchQuery("");
      setScheduledDate(null);
    } catch (error) {
      console.error("Error assigning technician:", error);
      alert("Failed to assign technician");
    } finally {
      setIsAssigning(false);
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

      // Refresh ticket data
      const ticketResponse = await fetch(`/api/maintenance/${id}`);
      if (!ticketResponse.ok) throw new Error("Failed to fetch ticket");
      const ticketData = await ticketResponse.json();
      setTicket(ticketData.ticket);

      setShowStatusModal(false);
      setNewStatus("");
      setStatusComment("");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
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
        minHeight="50vh"
      >
        <LoadingSpinner />
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
          sx={buttonStyles.primary.outlined}
        >
          Back to Maintenance List
        </Button>

        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            mt: 3,
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
                  <RoomIcon sx={{ color: colors.primary }} />
                  <Typography variant="subtitle1" color="text.secondary" component="div">
                    Room {ticket.room?.roomNumber}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  label={ticket.currentStatus}
                  color={getStatusColor(ticket.currentStatus)}
                  sx={{
                    ...chipStyles[getStatusColor(ticket.currentStatus)],
                    height: 32,
                    px: 1,
                  }}
                />
                {!["Completed", "Cancelled"].includes(ticket.currentStatus) && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowStatusModal(true)}
                    sx={buttonStyles.primary.outlined}
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
                  {formatDateWithTime(ticket.createdAt)}
                </Typography>
              </Box>
              {ticket.staff && ticket.scheduledDate && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div" gutterBottom>
                    Scheduled for
                  </Typography>
                  <Typography variant="body1" component="div" fontWeight="medium">
                    {formatDate(ticket.scheduledDate)}
                  </Typography>
                </Box>
              )}
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
                color: colors.primary,
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
                  color: colors.primary,
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
                color: colors.primary,
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
              {ticket.currentStatus !== "Completed" && ticket.currentStatus !== "Cancelled" && (
                <Button
                  variant="contained"
                  onClick={() => setShowTechnicianModal(true)}
                  sx={buttonStyles.primary.contained}
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
                  {ticket.scheduledDate && (
                    <Typography variant="body2" color="text.secondary" component="div">
                      Scheduled for {formatDate(ticket.scheduledDate)}
                    </Typography>
                  )}
                </Box>
              ) : ticket.currentStatus !== "Completed" && ticket.currentStatus !== "Cancelled" ? (
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
                color: colors.primary,
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
                        {formatDateWithTime(history.updatedAt)}
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
        onClose={() => {
          setShowTechnicianModal(false);
          setSearchQuery("");
          setScheduledDate(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: modalStyles.paper }}
      >
        <DialogTitle>
          {ticket.staff?._id ? "Change Technician" : "Assign Technician"}
        </DialogTitle>
        <DialogContent dividers sx={modalStyles.content}>
          {["Completed", "Cancelled"].includes(ticket.currentStatus) ? (
            <Typography color="error" sx={{ p: 2 }}>
              Cannot assign technician to a {ticket.currentStatus.toLowerCase()} ticket.
            </Typography>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Schedule Maintenance
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Select Date"
                    value={scheduledDate}
                    onChange={(newValue) => setScheduledDate(newValue)}
                    sx={{ width: '100%' }}
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        helperText: 'When should the maintenance work be done?',
                        required: true,
                        error: !scheduledDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              <Typography variant="h6" gutterBottom>
                Select Technician
              </Typography>
              <TextField
                fullWidth
                placeholder="Search technicians..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {filteredTechnicians.map((tech) => (
                  <ListItem
                    key={tech._id}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    secondaryAction={
                      <Button
                        onClick={() => handleAssignTechnician(tech._id)}
                        variant="contained"
                        size="small"
                        disabled={isAssigning || tech._id === ticket.staff?._id}
                        sx={buttonStyles.primary.contained}
                      >
                        {tech._id === ticket.staff?._id ? "Already Assigned" : isAssigning ? "Assigning..." : "Assign"}
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: colors.primary }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {tech.firstName} {tech.lastName}
                          {tech._id === ticket.staff?._id && (
                            <Chip
                              size="small"
                              label="Current"
                              sx={{
                                ml: 1,
                                bgcolor: 'rgba(136, 159, 99, 0.1)',
                                color: colors.primary,
                              }}
                            />
                          )}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {tech.specialization}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions sx={modalStyles.actions}>
          <Button
            onClick={() => {
              setShowTechnicianModal(false);
              setSearchQuery("");
              setScheduledDate(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        PaperProps={{ sx: modalStyles.paper }}
      >
        <DialogTitle>Update Status</DialogTitle>
        <DialogContent dividers sx={modalStyles.content}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
            >
              {["Completed", "Cancelled"]
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
            label="Comment"
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={modalStyles.actions}>
          <Button onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={!newStatus || !statusComment}
            sx={{
              ...buttonStyles.primary.contained,
              minWidth: '100px'
            }}
          >
            {isLoading ? (
              <LoadingSpinner  />
            ) : (
              "Update"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
