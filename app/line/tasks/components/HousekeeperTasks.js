"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Grid,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  DialogContentText
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

const HousekeeperTasks = ({ 
  activeTasks,
  completedTasks,
  isLoading,
  onUpdateTask,
  assignedBuildings = []
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  const capitalizeStatus = (status) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };


  // Show loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress size={24} sx={{ color: '#889F63' }} />
      </Box>
    );
  }

  // Only show no buildings message after loading is complete
  if (!isLoading && (!assignedBuildings || assignedBuildings.length === 0)) {
    return (
      <Paper 
        elevation={0} 
        className="border border-orange-200 bg-orange-50 p-4 rounded-lg"
      >
        <div className="flex items-center gap-2 mb-2">
          <WarningIcon className="text-orange-500" />
          <Typography variant="subtitle1" className="font-medium text-orange-700">
            No Buildings Assigned
          </Typography>
        </div>
        <Typography className="text-orange-600">
          You have not been assigned to any buildings yet. Please contact your administrator to get your building assignments.
        </Typography>
      </Paper>
    );
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setTimeout(() => setSelectedTask(null), 200);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (selectedTask) {
      try {
        await onUpdateTask(selectedTask._id, newStatus);
        handleClose();
      } catch (error) {
        console.error("Error updating task status:", error);
        // Show error message to user
        alert(`Error updating task: ${error.message}`);
      }
    }
  };

  const renderTaskList = (tasks) => {
    return tasks.map((task) => {
      return (
        <Paper key={task._id} className="p-4 mb-4">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <Typography variant="h6" className="text-gray-900">
                  Room {task.tenant.roomNumber || 'N/A'} - {task.building?.name || 'Unknown Building'}
                </Typography>
  
              </div>
              <Chip 
                label={capitalizeStatus(task.status)}
                size="small"
                className={
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  task.status === 'in process' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }
              />
            </div>

            <div>
              <Typography variant="body2" className="text-gray-600">
                {task.date ? new Date(task.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                {task.fromTime} - {task.toTime}
              </Typography>
            </div>

            {currentTab === 0 && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleTaskClick(task)}
                  className="border-[#889F63] text-[#889F63] hover:border-[#7A8F53] hover:bg-[#F5F7F2]"
                >
                  Update Status
                </Button>
              </div>
            )}

            {currentTab === 1 && task.completedAt && (
              <Typography variant="body2" className="text-gray-600">
                {task.status === 'completed' ? 'Completed' : 'Cancelled'} at: {
                  new Date(task.completedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }
              </Typography>
            )}
          </div>
        </Paper>
      );
    });
  };

  return (
    <div>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#889F63',
            },
            '& .Mui-selected': {
              color: '#889F63 !important',
            },
          }}
        >
          <Tab label={`Active Tasks (${activeTasks.length})`} />
          <Tab label={`Completed Tasks (${completedTasks.length})`} />
        </Tabs>
      </Box>

      <div role="tabpanel" hidden={currentTab !== 0}>
        {currentTab === 0 && (
          <div className="space-y-4">
            {activeTasks.length > 0 ? (
              renderTaskList(activeTasks)
            ) : (
              <Paper 
                elevation={0}
                className="border border-gray-200 p-4 rounded-lg text-center"
              >
                <Typography className="text-gray-600">
                  No active tasks at the moment
                </Typography>
              </Paper>
            )}
          </div>
        )}
      </div>

      <div role="tabpanel" hidden={currentTab !== 1}>
        {currentTab === 1 && (
          <div className="space-y-4">
            {completedTasks.length > 0 ? (
              renderTaskList(completedTasks)
            ) : (
              <Paper 
                elevation={0}
                className="border border-gray-200 p-4 rounded-lg text-center"
              >
                <Typography className="text-gray-600">
                  No completed tasks yet
                </Typography>
              </Paper>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "m-4 rounded-lg"
        }}
      >
        <DialogTitle className="bg-gray-50 border-b p-4">
          Update Task Status
        </DialogTitle>
        <DialogContent className="p-6">
          {selectedTask && (
            <>
              <div className="grid grid-cols-2 gap-4 my-6">
                <div>
                  <Typography variant="subtitle2" className="text-gray-500 mb-1">
                    Building & Room
                  </Typography>
                  <Typography variant="body1" className="text-gray-900">
                    {selectedTask.building?.name} - Room {selectedTask.bookedBy?.room?.roomNumber || 'N/A'}
                  </Typography>
                </div>
                <div>
                  <Typography variant="subtitle2" className="text-gray-500 mb-1">
                    Date & Time
                  </Typography>
                  <Typography variant="body1" className="text-gray-900">
                    {selectedTask.date ? new Date(selectedTask.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </Typography>
                  <Typography variant="body2" className="text-gray-700">
                    {selectedTask.timeSlot}
                  </Typography>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleStatusUpdate('completed')}
                  className="bg-[#889F63] text-white hover:bg-[#7A8F53] py-3 rounded-lg font-medium"
                >
                  Mark as Completed
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleStatusUpdate('cancelled')}
                  className="border-red-500 text-red-500 hover:bg-red-50 py-3 rounded-lg font-medium"
                >
                  Cancel Task
                </Button>
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions className="border-t p-4">
          <Button 
            onClick={handleClose}
            className="text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default HousekeeperTasks;
