"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  IconButton,
  Alert,
  Skeleton,
  Modal,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Pagination,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Chat as ChatIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

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

export default function TenantDetails({ params }) {
  const router = useRouter();
  const tenantId = use(params).id;
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [lineUserIdDialogOpen, setLineUserIdDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    lineId: "",
    lineUserId: "",
    depositAmount: "",
    leaseStartDate: null,
    leaseEndDate: null,
  });
  const { data: session } = useSession();
  const [openContactModal, setOpenContactModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedContact, setSelectedContact] = useState(null);
  const [currentLineContact, setCurrentLineContact] = useState(null);
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    try {
      const response = await fetch(`/api/tenant/${tenantId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tenant");
      }

      setTenant(data.tenant);
      setEditData({
        name: data.tenant.name || "",
        email: data.tenant.email || "",
        phone: data.tenant.phone || "",
        lineId: data.tenant.lineId || "",
        depositAmount: data.tenant.depositAmount || "",
        leaseStartDate: data.tenant.leaseStartDate
          ? dayjs(data.tenant.leaseStartDate)
          : null,
        leaseEndDate: data.tenant.leaseEndDate
          ? dayjs(data.tenant.leaseEndDate)
          : null,
      });

      if (data.tenant.lineUserId) {
        const lineContactResponse = await fetch(
          `/api/linecontact/${data.tenant.lineUserId}`
        );
        const lineContactData = await lineContactResponse.json();
        if (lineContactResponse.ok) {
          setCurrentLineContact(lineContactData.lineContact);
        }
      }
    } catch (error) {
      console.error("Error fetching tenant:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/tenant/${tenantId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete tenant");
      }

      router.push("/tenants");
    } catch (error) {
      console.error("Error deleting tenant:", error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTenant = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/tenant/${tenantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error("Failed to update tenant");
      }

      await fetchTenant();
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating tenant:", error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLineUserId = async () => {
    try {
      const response = await fetch(`/api/tenant/${tenantId}/line-user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lineUserId: editData.lineUserId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update LINE User ID");
      }

      await fetchTenant();
      setLineUserIdDialogOpen(false);
    } catch (error) {
      console.error("Error updating LINE User ID:", error);
      setError(error.message);
    }
  };

  const handleOpenContactModal = async () => {
    if (!session?.user?.id) {
      console.error("No session or user ID available");
      return;
    }

    setLoadingContacts(true);
    try {
      const response = await fetch(`/api/linecontact?id=${session.user.id}`);
      const data = await response.json();
      setContacts(Array.isArray(data.lineContacts) ? data.lineContacts : []);
    } catch (error) {
      console.error("Error fetching LINE contacts:", error);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
    setOpenContactModal(true);
  };

  const handleSelectContact = async (contact) => {
    try {
      const response = await fetch(`/api/tenant/${tenantId}/line-user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineUserId: contact.userId, // Only send the LINE User ID
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update LINE contact");
      }

      await fetchTenant();
      setSelectedContact(contact);
      setOpenContactModal(false);
    } catch (error) {
      console.error("Error updating LINE contact:", error);
      setError(error.message);
    }
  };

  const getSortedAndFilteredContacts = () => {
    return contacts
      .filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.lineId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else {
          return sortOrder === "asc"
            ? new Date(a.createdAt) - new Date(b.createdAt)
            : new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
  };

  const getPaginatedContacts = () => {
    const filteredContacts = getSortedAndFilteredContacts();
    const startIndex = (page - 1) * itemsPerPage;
    return {
      paginatedContacts: filteredContacts.slice(
        startIndex,
        startIndex + itemsPerPage
      ),
      totalPages: Math.ceil(filteredContacts.length / itemsPerPage),
    };
  };

  const handleCloseContactModal = () => {
    setOpenContactModal(false);
    setSearchQuery("");
    setPage(1);
  };

  const getRemainingDays = (endDate) => {
    if (!endDate) return 0;
    const end = dayjs(endDate);
    const now = dayjs();
    const days = end.diff(now, "day");
    return days >= 0 ? days : 0;
  };

  if (loading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            minHeight="50vh"
          >
            <LoadingSpinner />
          </Box>
        </Container>
      </LocalizationProvider>
    );
  }

  if (error) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </LocalizationProvider>
    );
  }

  if (!tenant) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">Tenant not found</Alert>
        </Container>
      </LocalizationProvider>
    );
  }

  // Get building name and room number safely
  const buildingName = tenant?.room?.floor?.building?.name;
  const roomNumber = tenant?.room?.roomNumber || "Unknown Room";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* Header with Edit Button */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
              <IconButton
                onClick={() => router.push("/tenants")}
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Avatar src={tenant.pfp} sx={{ width: 80, height: 80, mr: 3 }}>
                {tenant.name?.charAt(0) || "?"}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                  {tenant.name || "Unknown Tenant"}
                </Typography>
                <Chip
                  icon={<HomeIcon />}
                  label={`Building ${buildingName} - Room ${roomNumber}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <Button
                variant="contained"
                startIcon={<EditIcon sx={{ color: "white" }} />}
                onClick={() => setEditDialogOpen(true)}
                sx={{ 
                  bgcolor: "#898F63", 
                  '&:hover': { 
                    bgcolor: "#7C8F59" 
                  },
                  color: "white"
                }}
              >
                Edit Details
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Tenant Information */}
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Contact Information
                </Typography>
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <EmailIcon sx={{ mr: 2, color: "#898F63" }} />
                    <Typography>{tenant?.email}</Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <PhoneIcon sx={{ mr: 2, color: "#898F63" }} />
                    <Typography>{tenant?.phone}</Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <ChatIcon sx={{ mr: 2, color: "#898F63" }} />
                    <Typography>{tenant?.lineId || "Not set"}</Typography>
                  </Box>

                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
                    LINE Contact
                  </Typography>

                  {currentLineContact ? (
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}
                    >
                      <Avatar
                        src={currentLineContact.pfp}
                        sx={{ width: 48, height: 48, mr: 2 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          {currentLineContact.name}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Connected since:{" "}
                          {dayjs(currentLineContact.createdAt).format(
                            "MMM D, YYYY"
                          )}
                        </Typography>
                      </Box>
                      <Button
                        startIcon={<PersonAddIcon />}
                        onClick={handleOpenContactModal}
                        variant="outlined"
                        size="small"
                        sx={{
                          color: "#898F63",
                          borderColor: "#898F63",
                          "&:hover": {
                            borderColor: "#7C8F59",
                            backgroundColor: "rgba(137, 143, 99, 0.04)",
                          },
                        }}
                      >
                        Change LINE Contact
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography color="text.secondary">
                        No LINE contact connected
                      </Typography>
                      <Button
                        startIcon={<PersonAddIcon />}
                        onClick={handleOpenContactModal}
                        variant="outlined"
                        size="small"
                        sx={{
                          color: "#898F63",
                          borderColor: "#898F63",
                          "&:hover": {
                            borderColor: "#7C8F59",
                            backgroundColor: "rgba(137, 143, 99, 0.04)",
                          },
                        }}
                      >
                        Select LINE Contact
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Lease Information
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CalendarIcon sx={{ mr: 2, color: "#898F63" }} />
                    <Typography>
                      {tenant.leaseStartDate
                        ? new Date(tenant.leaseStartDate).toLocaleDateString()
                        : "No start date"}{" "}
                      -{" "}
                      {tenant.leaseEndDate
                        ? new Date(tenant.leaseEndDate).toLocaleDateString()
                        : "No end date"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MoneyIcon sx={{ mr: 2, color: "#898F63" }} />
                    <Typography>
                      Deposit: ฿{(tenant.depositAmount || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Actions */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon sx={{ color: "white" }} />}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ 
                  bgcolor: "#d32f2f", 
                  '&:hover': { 
                    bgcolor: "#d32f2f" 
                  },
                  color: "white"
                }}
              >
                Delete Tenant
              </Button>
            </Box>

            {/* Edit Dialog */}
            <Dialog
              open={editDialogOpen}
              onClose={() => setEditDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>Edit Tenant Details</DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={editData.email}
                      onChange={(e) =>
                        setEditData({ ...editData, email: e.target.value })
                      }
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Phone"
                      value={editData.phone}
                      onChange={(e) =>
                        setEditData({ ...editData, phone: e.target.value })
                      }
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="LINE ID"
                      value={editData.lineId}
                      onChange={(e) =>
                        setEditData({ ...editData, lineId: e.target.value })
                      }
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Deposit Amount"
                      type="number"
                      value={editData.depositAmount}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          depositAmount: e.target.value,
                        })
                      }
                      sx={{ mb: 2 }}
                    />
                    <DatePicker
                      label="Lease Start Date"
                      value={editData.leaseStartDate}
                      onChange={(newValue) =>
                        setEditData({ ...editData, leaseStartDate: newValue })
                      }
                      sx={{ mb: 2, width: "100%" }}
                    />
                    <DatePicker
                      label="Lease End Date"
                      value={editData.leaseEndDate}
                      onChange={(newValue) =>
                        setEditData({ ...editData, leaseEndDate: newValue })
                      }
                      sx={{ width: "100%" }}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditDialogOpen(false)}
                sx={{
                  color: "#d32f2f", 
                  "&:hover": {
                    backgroundColor: "rgba(66, 133, 244, 0.04)",
                  },
                }}
                  >Cancel</Button>
                <Button
                  onClick={handleUpdateTenant}
                  variant="contained"
                  disabled={submitting}
                  sx={{
                    bgcolor: "#898F63",
                    "&:hover": { bgcolor: "#7C8F59" },
                    minWidth: '120px'
                  }}
                >
                   {submitting ? <LoadingSpinner /> : "Save Changes"}
                </Button>
              </DialogActions>
            </Dialog>

            {/* LINE Contact Selection Modal */}
            <Modal
              open={openContactModal}
              onClose={handleCloseContactModal}
              aria-labelledby="contact-modal-title"
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 500,
                  maxHeight: "80vh",
                  bgcolor: "background.paper",
                  boxShadow: 24,
                  p: 4,
                  borderRadius: 1,
                  overflow: "auto",
                }}
              >
                <Typography
                  id="contact-modal-title"
                  variant="h6"
                  component="h2"
                  gutterBottom
                >
                  Select LINE Contact
                </Typography>

                <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Search LINE contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Sort by</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort by"
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <MenuItem value="name">Name</MenuItem>
                      <MenuItem value="date">Date Added</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton
                    onClick={() =>
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                    }
                    size="small"
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </IconButton>
                </Box>

                {loadingContacts ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                    <LoadingSpinner  />
                  </Box>
                ) : getPaginatedContacts().paginatedContacts.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      py: 4,
                      px: 2,
                      bgcolor: "grey.50",
                      borderRadius: 1,
                    }}
                  >
                    <PersonIcon
                      sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      No LINE Contacts Found
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ maxWidth: 300 }}
                    >
                      Add contacts by having them follow your LINE Official
                      Account.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <List sx={{ width: "100%", bgcolor: "background.paper" }}>
                      {getPaginatedContacts().paginatedContacts.map(
                        (contact) => (
                          <ListItem
                            key={contact._id}
                            onClick={() => handleSelectContact(contact)}
                            sx={{
                              mb: 1,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              cursor: "pointer",
                              "&:hover": {
                                backgroundColor: "action.hover",
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                src={contact.pfp}
                                alt={contact.name}
                                sx={{ width: 50, height: 50, mr: 2 }}
                              />
                            </ListItemAvatar>
                            <ListItemText
                              primary={contact.name}
                              secondary={
                                <Typography component="span" variant="body2">
                                  <Box component="span" display="block">
                                    Added:{" "}
                                    {dayjs(contact.createdAt).format(
                                      "MMM D, YYYY"
                                    )}
                                  </Box>
                                </Typography>
                              }
                            />
                          </ListItem>
                        )
                      )}
                    </List>

                    {getPaginatedContacts().totalPages > 1 && (
                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Pagination
                          count={getPaginatedContacts().totalPages}
                          page={page}
                          onChange={(e, newPage) => setPage(newPage)}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    )}
                  </>
                )}

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
                >
                  <Button onClick={handleCloseContactModal} >Cancel</Button>
                </Box>
              </Box>
            </Modal>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this tenant? This action cannot be
            undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: "#d32f2f", // Red cancel button
              "&:hover": {
                backgroundColor: "rgba(148, 80, 80, 0.04)",
              },
            }}
              >Cancel</Button>
            <Button onClick={handleDelete} 
            variant="contained"
            disabled={submitting}
            sx={{
              bgcolor: "#d32f2f",
              color: "white",
              "&:hover": { bgcolor: "#7a4040" },
              minWidth: '100px'
            }}
            autoFocus
            >
            {submitting ? <LoadingSpinner  /> : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
}
