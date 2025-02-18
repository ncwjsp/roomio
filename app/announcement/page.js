"use client";
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  CircularProgress,
  Fade,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CampaignIcon from "@mui/icons-material/Campaign";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { format } from "date-fns";
import { colors, buttonStyles } from "lib/styles";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/announcement");
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e, announcement) => {
    e.stopPropagation();
    setAnnouncementToDelete(announcement);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCancel = () => {
    setAnnouncementToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
    });
    setIsEditing(true);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIsEditing(false);
    setSelectedAnnouncement(null);
    setFormData({ title: "", content: "" });
  };

  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/announcement/${announcementToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      setAnnouncements(prev => prev.filter(a => a._id !== announcementToDelete._id));
      setDeleteConfirmOpen(false);
      setAnnouncementToDelete(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing 
        ? `/api/announcement/${selectedAnnouncement._id}`
        : "/api/announcement";
      
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(isEditing ? "Failed to update announcement" : "Failed to create announcement");
      }

      handleClose();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            color: colors.primary,
          }}
        >
          Announcements
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={buttonStyles.primary.contained}
        >
          New Announcement
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress sx={{ color: colors.primary }} />
        </Box>
      ) : error ? (
        <Box textAlign="center" color="error.main" my={4}>
          <Typography variant="h6">{error}</Typography>
        </Box>
      ) : announcements?.length === 0 ? (
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            textAlign: 'center',
            bgcolor: colors.primaryLight,
            borderRadius: 2,
            py: 8,
            px: 3,
          }}
        >
          <NotificationsActiveIcon 
            sx={{ 
              fontSize: 80, 
              color: colors.primary,
              mb: 3,
              opacity: 0.8
            }} 
          />
          <Typography 
            variant="h5" 
            sx={{ 
              color: colors.primary,
              fontWeight: 600,
              mb: 2
            }}
          >
            No Announcements Yet
          </Typography>
          <Typography 
            sx={{ 
              color: 'text.secondary',
              maxWidth: 450,
              lineHeight: 1.6
            }}
          >
            Create your first announcement to keep your tenants informed about important updates, maintenance schedules, or community events.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {announcements?.map((announcement, index) => (
            <Fade key={announcement._id} in={true} timeout={300} style={{ transitionDelay: `${index * 100}ms` }}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  transition: "all 0.3s ease-in-out",
                  cursor: "pointer",
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 3,
                    borderColor: colors.primary,
                  }
                }}
                onClick={() => handleAnnouncementClick(announcement)}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 600,
                          color: colors.primary,
                          mb: 2
                        }}
                      >
                        {announcement.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ 
                          whiteSpace: "pre-wrap", 
                          mb: 3,
                          color: "text.primary",
                          lineHeight: 1.6
                        }}
                      >
                        {announcement.content}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: "text.secondary",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5
                        }}
                      >
                        Posted {format(new Date(announcement.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        onClick={(e) => handleDeleteClick(e, announcement)}
                        sx={{ 
                          color: colors.primary,
                          '&:hover': {
                            color: 'error.main',
                            bgcolor: 'error.light',
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          ))}
        </Stack>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: 3,
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle 
            sx={{ 
              pb: 1,
              pt: 3,
              px: 4
            }}
          >
            <Typography 
              variant="h5" 
              component="div"
              sx={{ 
                color: colors.primary,
                fontWeight: 600
              }}
            >
              {isEditing ? "Edit Announcement" : "New Announcement"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: colors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: colors.primary,
                },
              }}
            />
            <TextField
              margin="dense"
              label="Content"
              fullWidth
              multiline
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: colors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: colors.primary,
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 3 }}>
            <Button 
              onClick={handleClose}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={buttonStyles.primary.contained}
            >
              {isEditing ? "Update" : "Create & Send"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: 3,
          }
        }}
      >
        <DialogTitle sx={{ pt: 3, px: 4 }}>
          <Typography variant="h6" component="div" fontWeight={600}>
            Delete Announcement
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          <Typography>
            Are you sure you want to delete this announcement? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3 }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
