"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  CircularProgress,
  ImageList,
  ImageListItem
} from "@mui/material";

export default function MaintenanceTasks({ 
  activeTasks, 
  completedTasks, 
  onUpdateTask,
  technicianId,
  isLoading 
}) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [statusComment, setStatusComment] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [currentTab, setCurrentTab] = useState(0);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowUpdateModal(true);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageDialog(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedTask || !newStatus) return;

    try {
      await onUpdateTask(selectedTask._id, newStatus, statusComment, technicianId);
      setShowUpdateModal(false);
      setStatusComment("");
      setNewStatus("");
      setSelectedTask(null);
    } catch (error) {
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress sx={{ color: '#889F63' }} />
      </Box>
    );
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const renderTaskImages = (task) => {
    if (!task.images || task.images.length === 0) return null;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          Images:
        </Typography>
        <ImageList sx={{ width: '100%', height: 'auto' }} cols={2} rowHeight={120}>
          {task.images.map((image, index) => (
            <ImageListItem 
              key={index} 
              onClick={() => handleImageClick(image.url)}
              sx={{ cursor: 'pointer' }}
            >
              <img
                src={image.url}
                alt={`Maintenance image ${index + 1}`}
                loading="lazy"
                style={{ borderRadius: '4px' }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      </Box>
    );
  };

  return (
    <div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#889F63',
            },
          }}
        >
          <Tab 
            label={`Active Tasks (${activeTasks?.length || 0})`}
            sx={{
              '&.Mui-selected': {
                color: '#889F63',
              },
            }}
          />
          <Tab 
            label={`Completed Tasks (${completedTasks?.length || 0})`}
            sx={{
              '&.Mui-selected': {
                color: '#889F63',
              },
            }}
          />
        </Tabs>
      </Box>

      <div>
        {currentTab === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeTasks?.length > 0 ? (
              activeTasks.map((task) => (
                <Paper
                  key={task._id}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid #e5e7eb',
                    borderRadius: 1,
                    '&:hover': {
                      borderColor: '#889F63',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          Room {task.tenant.roomNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {task.room.floor.building.name}
                        </Typography>
                      </Box>
                      <Chip 
                        label={task.currentStatus}
                        size="small"
                        sx={{
                          bgcolor: 
                            task.currentStatus === 'Completed' ? '#dcfce7 !important' :
                            task.currentStatus === 'Cancelled' ? '#fee2e2 !important' :
                            task.currentStatus === 'In Progress' ? '#dbeafe !important' :
                            '#f3f4f6 !important',
                          color: 
                            task.currentStatus === 'Completed' ? '#166534 !important' :
                            task.currentStatus === 'Cancelled' ? '#991b1b !important' :
                            task.currentStatus === 'In Progress' ? '#1e40af !important' :
                            '#1f2937 !important',
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(task.scheduledDate)}
                      </Typography>
                      {task.problem && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          {task.problem}
                        </Typography>
                      )}
                    </Box>

                    {renderTaskImages(task)}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleTaskClick(task)}
                        sx={{
                          borderColor: '#889F63',
                          color: '#889F63',
                          '&:hover': {
                            borderColor: '#7A8F53',
                            bgcolor: '#F5F7F2',
                          },
                        }}
                      >
                        Update Status
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  borderRadius: 1
                }}
              >
                <Typography sx={{ color: 'text.secondary' }}>
                  No active tasks
                </Typography>
              </Paper>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {completedTasks?.length > 0 ? (
              completedTasks.map((task) => (
                <Paper
                  key={task._id}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid #e5e7eb',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          Room {task.room.roomNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {task.room.floor.building.name}
                        </Typography>
                      </Box>
                      <Chip 
                        label={task.currentStatus}
                        size="small"
                        sx={{
                          bgcolor: 
                            task.currentStatus === 'Completed' ? '#dcfce7 !important' :
                            task.currentStatus === 'Cancelled' ? '#fee2e2 !important' :
                            task.currentStatus === 'In Progress' ? '#dbeafe !important' :
                            '#f3f4f6 !important',
                          color: 
                            task.currentStatus === 'Completed' ? '#166534 !important' :
                            task.currentStatus === 'Cancelled' ? '#991b1b !important' :
                            task.currentStatus === 'In Progress' ? '#1e40af !important' :
                            '#1f2937 !important',
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(task.scheduledDate)}
                      </Typography>
                      {task.problem && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          {task.problem}
                        </Typography>
                      )}
                    </Box>

                    {renderTaskImages(task)}

                    {task.updatedAt && (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {task.currentStatus} at: {
                          new Date(task.updatedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        }
                      </Typography>
                    )}
                  </Box>
                </Paper>
              ))
            ) : (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  borderRadius: 1
                }}
              >
                <Typography sx={{ color: 'text.secondary' }}>
                  No completed tasks
                </Typography>
              </Paper>
            )}
          </div>
        )}
      </div>

      <Dialog open={showUpdateModal} onClose={() => setShowUpdateModal(false)}>
        <DialogTitle>Update Task Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Current Status: {selectedTask?.currentStatus}
            </Typography>
          </Box>

          <TextField
            select
            fullWidth
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Comment"
            multiline
            rows={3}
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateModal(false)} sx={{ color: '#889F63' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained"
            sx={{ 
              bgcolor: '#889F63',
              '&:hover': {
                bgcolor: '#7A8F53',
              },
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog 
        open={showImageDialog} 
        onClose={() => setShowImageDialog(false)}
        maxWidth="md"
      >
        <DialogContent sx={{ p: 1 }}>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Maintenance issue" 
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowImageDialog(false)} 
            sx={{ color: '#889F63' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
