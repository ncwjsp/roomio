"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Room as RoomIcon,
  Description as DescriptionIcon,
  Build as BuildIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

export default function TasksPage() {
  const [activeTasks, setActiveTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [statusComment, setStatusComment] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [newStatus, setNewStatus] = useState("");
  const [lineUserId, setLineUserId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, "PPP 'at' p");
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const sortTasks = (tasks) => {
    return [...tasks].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  };

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const { searchParams } = new URL(window.location.href);
        const id = searchParams.get("id"); // landlord's id

        if (!id) {
          throw new Error("ID not provided in URL");
        }

        // Get the tasks-specific LIFF ID for this landlord
        const response = await fetch(`/api/user/line-config?id=${id}`);
        const data = await response.json();
        console.log("Line config response:", data);

        if (!data.lineConfig?.liffIds?.tasks) {
          throw new Error("LIFF ID not configured for tasks feature");
        }

        const liff = (await import("@line/liff")).default;
        await liff.init({
          liffId: data.lineConfig.liffIds.tasks,
        });

        if (!liff.isLoggedIn()) {
          await liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
        const techResponse = await fetch(`/api/technician/tasks?lineUserId=${profile.userId}`);
        if (!techResponse.ok) {
          throw new Error("Failed to fetch technician data");
        }
        const techData = await techResponse.json();
        setTechnicianId(techData.technicianId);
        setActiveTasks(techData.activeTasks);
        setCompletedTasks(techData.completedTasks);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize LIFF:", error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    initializeLiff();
  }, []);

  const fetchTasks = async (lineUserId) => {
    try {
      const response = await fetch(`/api/technician/tasks?lineUserId=${lineUserId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setActiveTasks(data.activeTasks);
      setCompletedTasks(data.completedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTask || !newStatus) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/technician/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: selectedTask._id,
          status: newStatus,
          comment: statusComment,
          technicianId: technicianId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const { task } = await response.json();
      
      // Update the tasks lists
      if (newStatus === "Completed") {
        setActiveTasks(activeTasks.filter(t => t._id !== task._id));
        setCompletedTasks([task, ...completedTasks]);
      } else {
        setActiveTasks(activeTasks.map(t => t._id === task._id ? task : t));
      }

      setShowUpdateModal(false);
      setStatusComment("");
      setNewStatus("");
      setSelectedTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task status");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "in progress":
        return "info";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: "#889F63" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        My Tasks
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root.Mui-selected': {
              color: '#889F63',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#889F63',
            },
          }}
        >
          <Tab label="Active Tasks" />
          <Tab label="Completed Tasks" />
        </Tabs>
      </Box>

      {/* Sort Order */}
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sort by Date</InputLabel>
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            label="Sort by Date"
          >
            <MenuItem value="desc">Newest First</MenuItem>
            <MenuItem value="asc">Oldest First</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {activeTab === 0 ? (
        <List>
          {sortTasks(activeTasks).map((task) => (
            <Paper
              key={task._id}
              elevation={2}
              sx={{ mb: 2, overflow: "hidden" }}
            >
              <ListItem
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  bgcolor: "#fff",
                  borderRadius: 1,
                  mb: 1,
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {task.problem}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {task.description}
                    </Typography>
                  </Box>
                  {!["Completed", "Cancelled"].includes(task.currentStatus) && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedTask(task);
                        setShowUpdateModal(true);
                      }}
                      sx={{
                        color: "#889F63",
                        borderColor: "#889F63",
                        "&:hover": {
                          borderColor: "#889F63",
                          bgcolor: "rgba(136, 159, 99, 0.08)",
                        },
                      }}
                    >
                      Update Status
                    </Button>
                  )}
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <RoomIcon fontSize="small" color="action" />
                    <Typography variant="body2" component="span">
                      Building {task.room?.building?.name}, Floor {task.room?.floor?.floorNumber}, Room {task.room?.roomNumber}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2" component="span">
                      Created: {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
            </Paper>
          ))}
          {activeTasks.length === 0 && (
            <Typography color="text.secondary" align="center" py={4}>
              No active tasks
            </Typography>
          )}
        </List>
      ) : (
        <List>
          {sortTasks(completedTasks).map((task) => (
            <Paper
              key={task._id}
              elevation={2}
              sx={{ mb: 2, overflow: "hidden" }}
            >
              <ListItem>
                <ListItemText
                  primaryTypographyProps={{ component: "div" }}
                  secondaryTypographyProps={{ component: "div" }}
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" component="div">{task.problem}</Typography>
                      <Chip
                        label={task.currentStatus}
                        color={getStatusColor(task.currentStatus)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <RoomIcon fontSize="small" color="action" />
                        <Typography variant="body2" component="span">
                          Building {task.room?.building?.name}, Floor {task.room?.floor?.floorNumber}, Room {task.room?.roomNumber}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="body2" component="span">
                          Completed: {format(new Date(task.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </Paper>
          ))}
          {completedTasks.length === 0 && (
            <Typography color="text.secondary" align="center" py={4}>
              No completed tasks
            </Typography>
          )}
        </List>
      )}

      {/* Update Status Modal */}
      <Dialog 
        open={showUpdateModal} 
        onClose={() => {
          setShowUpdateModal(false);
          setStatusComment("");
          setNewStatus("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Task Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" component="div" fontWeight="medium" gutterBottom>
              {selectedTask?.problem}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <RoomIcon fontSize="small" color="action" />
              <Typography variant="body2" component="span">
                Building {selectedTask?.room?.building?.name}, Floor {selectedTask?.room?.floor?.floorNumber}, Room {selectedTask?.room?.roomNumber}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <DescriptionIcon fontSize="small" color="action" />
              <Typography variant="body2" component="span">
                {selectedTask?.description}
              </Typography>
            </Box>
          </Box>

          {/* Tenant Information */}
          {selectedTask?.room?.tenant && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                Tenant Information
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" component="span">
                    {selectedTask?.room?.tenant?.name}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2" component="span">
                    {selectedTask?.room?.tenant?.phone}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <ChatIcon fontSize="small" color="action" />
                  <Typography variant="body2" component="span">
                    LINE ID: {selectedTask?.room?.tenant?.lineId}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Update Status
            </Typography>
            <Box display="flex" gap={1}>
              {["Completed", "Cancelled"]
                .filter(status => status !== selectedTask?.currentStatus)
                .map((status) => (
                <Button
                  key={status}
                  variant={newStatus === status ? "contained" : "outlined"}
                  onClick={() => setNewStatus(status)}
                  sx={{
                    borderColor: "#889F63",
                    color: newStatus === status ? "#fff" : "#889F63",
                    bgcolor: newStatus === status ? "#889F63" : "transparent",
                    "&:hover": {
                      borderColor: "#889F63",
                      bgcolor: newStatus === status ? "#7A8F53" : "rgba(136, 159, 99, 0.08)",
                    },
                  }}
                >
                  {status}
                </Button>
              ))}
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Add a comment (optional)"
            multiline
            rows={3}
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowUpdateModal(false);
              setStatusComment("");
              setNewStatus("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={!newStatus}
            sx={{
              bgcolor: "#889F63",
              color: "white",
              "&:hover": {
                bgcolor: "#7A8F53",
              },
              "&:disabled": {
                bgcolor: "action.disabledBackground",
              },
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
