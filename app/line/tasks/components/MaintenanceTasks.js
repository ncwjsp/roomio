"use client";

import { useState } from "react";
import {
  Box,
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
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Room as RoomIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

export default function MaintenanceTasks({ 
  activeTasks, 
  completedTasks, 
  onUpdateTask 
}) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [statusComment, setStatusComment] = useState("");
  const [newStatus, setNewStatus] = useState("");

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

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowUpdateModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedTask || !newStatus) return;

    try {
      await onUpdateTask(selectedTask._id, newStatus, statusComment);
      setShowUpdateModal(false);
      setStatusComment("");
      setNewStatus("");
      setSelectedTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task status");
    }
  };

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

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Active Maintenance Tasks
        </Typography>
        {activeTasks?.length > 0 ? (
          <List>
            {activeTasks.map((task) => (
              <MaintenanceTaskItem
                key={task._id}
                task={task}
                onStatusUpdate={() => handleTaskClick(task)}
                formatDate={formatDate}
              />
            ))}
          </List>
        ) : (
          <Typography color="textSecondary">
            No active maintenance tasks found
          </Typography>
        )}
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Completed Maintenance Tasks
        </Typography>
        {completedTasks?.length > 0 ? (
          <List>
            {completedTasks.map((task) => (
              <MaintenanceTaskItem
                key={task._id}
                task={task}
                completed
                formatDate={formatDate}
              />
            ))}
          </List>
        ) : (
          <Typography color="textSecondary">
            No completed maintenance tasks found
          </Typography>
        )}
      </Box>

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
        <DialogTitle>Update Maintenance Status</DialogTitle>
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
              {["Completed", "In Progress", "Cancelled"]
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
    </>
  );
}

function MaintenanceTaskItem({ task, onStatusUpdate, completed, formatDate }) {
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

  return (
    <Paper elevation={2} sx={{ mb: 2, overflow: "hidden" }}>
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
                  {completed ? 
                    `Completed: ${formatDate(task.updatedAt)}` : 
                    `Created: ${formatDate(task.createdAt)}`
                  }
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <DescriptionIcon fontSize="small" color="action" />
                <Typography variant="body2" component="span">
                  {task.description}
                </Typography>
              </Box>
            </Box>
          }
        />
      </ListItem>
      {!completed && (
        <Button
          variant="outlined"
          size="small"
          onClick={onStatusUpdate}
          sx={{
            m: 1,
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
    </Paper>
  );
}
