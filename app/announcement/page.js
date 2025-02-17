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
      const response = await fetch(
        `/api/announcement/${announcementToDelete._id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete announcement");
      }

      await fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
    } finally {
      setDeleteConfirmOpen(false);
      setAnnouncementToDelete(null);
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
          mb: 6
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #898f63 30%, #5D6142 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Announcements
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{
            background: 'linear-gradient(45deg, #898f63 30%, #5D6142 90%)',
            boxShadow: '0 3px 5px 2px rgba(137, 143, 99, .3)',
            color: 'white',
            px: 3,
            py: 1,
            '&:hover': {
              background: 'linear-gradient(45deg, #7A8057 30%, #4D513A 90%)',
            }
          }}
        >
          New Announcement
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress sx={{ color: "#898f63" }} />
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
            background: 'linear-gradient(135deg, rgba(137, 143, 99, 0.05) 0%, rgba(93, 97, 66, 0.05) 100%)',
            borderRadius: 4,
            py: 8,
            px: 3,
          }}
        >
          <NotificationsActiveIcon 
            sx={{ 
              fontSize: 80, 
              color: '#898f63',
              mb: 3,
              opacity: 0.8
            }} 
          />
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#898f63',
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
                  borderRadius: 3,
                  transition: "all 0.3s ease-in-out",
                  cursor: "pointer",
                  border: '1px solid rgba(137, 143, 99, 0.1)',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 250, 251, 1) 100%)',
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: '0 8px 20px -12px rgba(137, 143, 99, 0.5)',
                    borderColor: 'rgba(137, 143, 99, 0.2)',
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
                          color: "#898f63",
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
                          color: "#4A4A4A",
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
                          color: '#898f63',
                          opacity: 0.7,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            opacity: 1,
                            color: '#dc3545',
                            transform: 'scale(1.1)',
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
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
                background: 'linear-gradient(45deg, #898f63 30%, #5D6142 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
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
                    borderColor: '#898f63',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#898f63',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#898f63',
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
                    borderColor: '#898f63',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#898f63',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#898f63',
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
              sx={{
                background: 'linear-gradient(45deg, #898f63 30%, #5D6142 90%)',
                boxShadow: '0 3px 5px 2px rgba(137, 143, 99, .3)',
                color: 'white',
                px: 4,
                '&:hover': {
                  background: 'linear-gradient(45deg, #7A8057 30%, #4D513A 90%)',
                }
              }}
            >
              {isEditing ? "Update" : "Create & Send"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ pt: 3, px: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#dc3545',
              fontWeight: 600
            }}
          >
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 4 }}>
          <Typography sx={{ color: '#4A4A4A' }}>
            Are you sure you want to delete the announcement "
            <strong>{announcementToDelete?.title}</strong>"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3 }}>
          <Button 
            onClick={handleDeleteCancel}
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
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{ 
              bgcolor: '#dc3545',
              color: 'white',
              px: 3,
              '&:hover': {
                bgcolor: '#bb2d3b'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
