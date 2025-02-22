import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Box,
  Avatar,
  Typography,
  IconButton,
  Modal,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
  Snackbar,
  Alert,
  Pagination,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import { format } from "date-fns";

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

const StaffForm = ({ initialData, onSubmit, onCancel, submitButtonText = "Add Staff" }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: "General",
    specialization: "",
    lineId: "",
    lineUserId: "",
    lineDisplayName: "",
    linePicture: "",
    salary: "",
    startDate: null,
    ...initialData,
    startDate: initialData?.startDate ? new Date(initialData.startDate) : null,
  });

  const [errors, setErrors] = useState({});
  const [lineContacts, setLineContacts] = useState([]);
  const [lineContactsLoading, setLineContactsLoading] = useState(false);
  const { data: session } = useSession();
  const [showLineSelect, setShowLineSelect] = useState(false);
  const [openContactModal, setOpenContactModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedContact, setSelectedContact] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(prev => ({ ...prev, open: false }));
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const roles = [
    { id: "General", label: "General Staff" },
    { id: "Housekeeper", label: "Housekeeper" },
    { id: "Technician", label: "Technician" },
  ];

  useEffect(() => {
    if (["Housekeeper", "Technician"].includes(formData.role)) {
      fetchLineContacts();
    }
  }, [formData.role]);

  const fetchLineContacts = async () => {
    if (!session?.user?.id) return;
    
    setLineContactsLoading(true);
    try {
      const response = await fetch(`/api/linecontact?id=${session.user.id}`);
      if (!response.ok) throw new Error("Failed to fetch LINE contacts");
      const data = await response.json();
      console.log("Fetched LINE contacts:", data);
      setLineContacts(data.lineContacts || []);
    } catch (error) {
      console.error("Failed to fetch LINE contacts:", error);
      setLineContacts([]);
    } finally {
      setLineContactsLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData((prev) => ({
      ...prev,
      role: newRole || "",
      lineUserId: newRole === "General" ? "" : prev.lineUserId || "",
      lineDisplayName: newRole === "General" ? "" : prev.lineDisplayName || "",
      linePicture: newRole === "General" ? "" : prev.linePicture || "",
    }));
    setShowLineSelect(["Housekeeper", "Technician"].includes(newRole));
  };

  const handleOpenContactModal = () => {
    setOpenContactModal(true);
  };

  const handleCloseContactModal = () => {
    setOpenContactModal(false);
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setFormData((prev) => ({
      ...prev,
      lineUserId: contact.userId || "",
      lineDisplayName: contact.name || "",
      linePicture: contact.pfp || "",
    }));
    setOpenContactModal(false);
  };

  const handleDeselectContact = () => {
    setSelectedContact(null);
    setFormData((prev) => ({
      ...prev,
      lineUserId: "",
      lineDisplayName: "",
      linePicture: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.salary) newErrors.salary = "Salary is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    
    if (["Housekeeper", "Technician"].includes(formData.role) && !formData.lineUserId) {
      newErrors.contact = "LINE contact is required for this role";
    }
    
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (validateForm()) {
          onSubmit(formData);
        } else {
          showNotification("Please fix the errors in the form", "error");
        }
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-6">
        <TextField
          label="First Name"
          required
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          error={!!errors.firstName}
          helperText={errors.firstName}
          sx={{ 
            '& .MuiInputLabel-root': { 
              top: '-8px',
              '&.Mui-focused': {
                top: '0px'
              }
            }
          }}
        />
        <TextField
          label="Last Name"
          required
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          error={!!errors.lastName}
          helperText={errors.lastName}
          sx={{ 
            '& .MuiInputLabel-root': { 
              top: '-8px',
              '&.Mui-focused': {
                top: '0px'
              }
            }
          }}
        />
      </div>

      <FormControl fullWidth required error={!!errors.role} sx={{ '& .MuiFormLabel-root': { background: 'white', px: 1 } }}>
        {initialData?._id ? (
          <TextField
            label="Role"
            value={formData.role}
            fullWidth
            disabled
            sx={{
              "& .MuiInputBase-input.Mui-disabled": {
                WebkitTextFillColor: "#1F2937",
              },
            }}
          />
        ) : (
          <>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={handleRoleChange}
              label="Role"
            >
              <MenuItem value="General">General Staff</MenuItem>
              <MenuItem value="Housekeeper">Housekeeper</MenuItem>
              <MenuItem value="Technician">Technician</MenuItem>
            </Select>
          </>
        )}
        {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
      </FormControl>

      {formData.role === "Technician" && (
        <TextField
          label="Specialization"
          fullWidth
          value={formData.specialization}
          onChange={(e) =>
            setFormData({ ...formData, specialization: e.target.value })
          }
          helperText="e.g., Electrician, Plumber, HVAC"
        />
      )}

      <TextField
        label="LINE ID"
        fullWidth
        value={formData.lineId}
        onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
        sx={{ '& .MuiFormLabel-root': { background: 'white', px: 1 } }}
      />

      {showLineSelect && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenContactModal}
              sx={{
                borderRadius: 2,
                py: 1.5,
                px: 3,
                borderColor: errors.contact ? "error.main" : "#898F63",
                color: errors.contact ? "error.main" : "#898F63",
                "&:hover": {
                  borderColor: errors.contact ? "error.dark" : "#7C8F59",
                  backgroundColor: errors.contact ? "error.50" : "rgba(137, 143, 99, 0.04)",
                },
              }}
            >
              {selectedContact
                ? "Change LINE Contact"
                : "Select LINE Contact *"}
            </Button>
            {errors.contact && (
              <FormHelperText error>{errors.contact}</FormHelperText>
            )}
            {selectedContact && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  pl: 3,
                  pr: 5,
                  borderRadius: 2,
                  backgroundColor: "grey.50",
                  position: "relative",
                  minWidth: 250,
                }}
              >
                <Avatar
                  src={formData.linePicture}
                  alt={formData.lineDisplayName}
                  sx={{ width: 40, height: 40 }}
                />
                <Box sx={{ flex: 1, mr: 4 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {formData.lineDisplayName}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="textSecondary"
                    sx={{ 
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {selectedContact.lineId}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={handleDeselectContact}
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "grey.500",
                    "&:hover": {
                      backgroundColor: "grey.100",
                      color: "grey.700",
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <div className="grid grid-cols-2 gap-6">
        <TextField
          label="Phone"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={!!errors.phone}
          helperText={errors.phone}
          sx={{ 
            '& .MuiInputLabel-root': { 
              top: '-8px',
              '&.Mui-focused': {
                top: '0px'
              }
            }
          }}
        />
        <TextField
          label="Salary"
          type="number"
          required
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          error={!!errors.salary}
          helperText={errors.salary}
          InputProps={{
            startAdornment: <InputAdornment position="start">THB</InputAdornment>,
          }}
          sx={{ 
            '& .MuiInputLabel-root': { 
              top: '-8px',
              '&.Mui-focused': {
                top: '0px'
              }
            }
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={formData.startDate}
            onChange={(newValue) => {
              setFormData({ ...formData, startDate: newValue });
            }}
            slotProps={{
              textField: {
                required: true,
                error: !!errors.startDate,
                helperText: errors.startDate,
                sx: { 
                  '& .MuiInputLabel-root': { 
                    top: '-8px',
                    '&.Mui-focused': {
                      top: '0px'
                    }
                  }
                }
              }
            }}
          />
        </LocalizationProvider>
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outlined"
            sx={{
              borderColor: '#898F63',
              color: '#898F63',
              '&:hover': {
                borderColor: '#7C8F59',
                backgroundColor: 'rgba(137, 143, 99, 0.04)',
              },
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          sx={{
            bgcolor: '#898F63',
            '&:hover': {
              bgcolor: '#7C8F59',
            },
          }}
        >
          {submitButtonText}
        </Button>
      </div>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

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
          <Typography variant="h6" component="h2" gutterBottom>
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
                <MenuItem value="date">Added Date</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                label="Order"
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {lineContactsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <LoadingSpinner />
            </Box>
          ) : lineContacts.length === 0 ? (
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
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No LINE Contacts Found
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Add contacts by having them follow your LINE Official Account.
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: "100%", bgcolor: "background.paper" }}>
              {lineContacts
                .filter((contact) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  const name = (contact.name || '').toLowerCase();
                  const lineId = (contact.lineId || '').toLowerCase();
                  return name.includes(query) || lineId.includes(query);
                })
                .sort((a, b) => {
                  if (sortBy === "name") {
                    return sortOrder === "asc"
                      ? a.name.localeCompare(b.name)
                      : b.name.localeCompare(a.name);
                  } else if (sortBy === "date") {
                    const dateA = new Date(a.addedAt);
                    const dateB = new Date(b.addedAt);
                    return sortOrder === "asc"
                      ? dateA - dateB
                      : dateB - dateA;
                  }
                  return 0;
                })
                .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                .map((contact) => (
                  <ListItem
                    key={contact.userId}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                    onClick={() => handleSelectContact(contact)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={contact.pfp}
                        alt={contact.name}
                        sx={{ width: 40, height: 40 }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {contact.lineId}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            Added {format(new Date(contact.addedAt || Date.now()), "MMM d, yyyy")}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              {lineContacts.length > itemsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
                  <Pagination
                    count={Math.ceil(lineContacts.length / itemsPerPage)}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="medium"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </List>
          )}
        </Box>
      </Modal>
    </form>
  );
};

export default StaffForm;
