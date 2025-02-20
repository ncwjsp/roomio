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
  CircularProgress,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";

const StaffForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: "General",
    specialization: "",
    lineId: "", // Basic LINE ID
    lineUserId: "", // LINE Official Account user ID
    lineDisplayName: "",
    linePicture: "",
    salary: "",
    startDate: "",
    ...initialData,
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
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.salary) newErrors.salary = "Salary is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    
    if (["Housekeeper", "Technician"].includes(formData.role) && !formData.lineUserId) {
      newErrors.contact = "LINE contact is required for this role";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
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
        }
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="First Name"
          required
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          error={!!errors.firstName}
          helperText={errors.firstName}
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
        />
      </div>

      <FormControl fullWidth required error={!!errors.role}>
        <InputLabel>Role</InputLabel>
        <Select value={formData.role} onChange={handleRoleChange}>
          {roles.map((role) => (
            <MenuItem key={role.id} value={role.id}>
              {role.label}
            </MenuItem>
          ))}
        </Select>
        {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
      </FormControl>

      {formData.role && (
        <TextField
          label="Specialization"
          fullWidth
          value={formData.specialization}
          onChange={(e) =>
            setFormData({ ...formData, specialization: e.target.value })
          }
          helperText={
            formData.role === "Housekeeper"
              ? "e.g., Floor Manager, Deep Cleaning"
              : formData.role === "Technician"
              ? "e.g., Electrician, Plumber, HVAC"
              : formData.role === "General"
              ? "e.g., Security, Receptionist, Admin"
              : "Specify staff specialization"
          }
        />
      )}

      <TextField
        label="LINE ID"
        fullWidth
        value={formData.lineId}
        onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
        helperText="Optional: Staff's LINE ID (@example)"
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
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: "grey.50",
                  position: "relative",
                }}
              >
                <Avatar
                  src={formData.linePicture}
                  alt={formData.lineDisplayName}
                  sx={{ width: 40, height: 40 }}
                />
                <Box>
                  <Typography variant="subtitle2">
                    {formData.lineDisplayName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedContact.lineId}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={handleDeselectContact}
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: 8,
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Phone"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={!!errors.phone}
          helperText={errors.phone}
        />
        <TextField
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={!!errors.email}
          helperText={errors.email}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Start Date"
          type="date"
          required
          value={formData.startDate}
          onChange={(e) =>
            setFormData({ ...formData, startDate: e.target.value })
          }
          InputLabelProps={{ shrink: true }}
          error={!!errors.startDate}
          helperText={errors.startDate}
        />
        <TextField
          label="Salary"
          type="number"
          required
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          error={!!errors.salary}
          helperText={errors.salary}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          onClick={onCancel}
          sx={{
            color: "#d32f2f",
            "&:hover": {
              backgroundColor: "rgba(112, 116, 84, 0.04)"
            }
          }}
        >
          Cancel</Button>
        <Button 
          type="submit" 
          variant="contained" 
          sx={{
            backgroundColor: "#898F63",
            "&:hover": {
              backgroundColor: "#777c54"
            }
          }}
          >
          {initialData._id ? "Update" : "Add"} Staff Member
        </Button>
      </div>

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

          {lineContactsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
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
                .filter(
                  (contact) =>
                    contact.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    contact.lineId
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
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
                })
                .map((contact) => (
                  <ListItem
                    key={contact.userId}
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
                      <Avatar src={contact.pfp} alt={contact.name} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={contact.lineId}
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </Box>
      </Modal>
    </form>
  );
};

export default StaffForm;
