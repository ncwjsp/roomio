"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CircularProgress, Snackbar, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment } from "@mui/material";
import StaffList from "@/app/staffs/components/StaffList";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import StaffForm from "./components/StaffForm";

const LoadingSpinner = ({ size = 'large' }) => {
  const sizes = {
    small: {
      wrapper: "w-6 h-6",
      position: "left-[11px] top-[6px]",
      bar: "w-[2px] h-[4px]",
      origin: "origin-[1px_7px]"
    },
    medium: {
      wrapper: "w-24 h-24",
      position: "left-[47px] top-[24px]",
      bar: "w-1.5 h-3",
      origin: "origin-[3px_26px]"
    },
    large: {
      wrapper: "w-48 h-48",
      position: "left-[94px] top-[48px]",
      bar: "w-3 h-6",
      origin: "origin-[6px_52px]"
    }
  };

  return (
    <div className={`${sizes[size].wrapper} inline-block overflow-hidden bg-transparent`}>
      <div className="w-full h-full relative transform scale-100 origin-[0_0]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute ${sizes[size].position} ${sizes[size].bar} rounded-[5.76px] bg-[#898f63] ${sizes[size].origin}`}
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


const StaffPage = () => {
  const { data: session } = useSession();
  const [staffData, setStaffData] = useState([]);
  const [selectedRole, setSelectedRole] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const roles = [
    { id: "All", label: "All" },
    { id: "Housekeeper", label: "Housekeeper" },
    { id: "Technician", label: "Technician" },
    { id: "General", label: "General Staff" },
  ];

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/staff");
      if (!response.ok) {
        throw new Error("Failed to fetch staff data");
      }
      const data = await response.json();
      setStaffData(data);
      setIsLoading(false);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchStaff();
    }
  }, [session?.user?.id]);

  const filteredStaff = staffData.filter(staff => 
    (`${staff.firstName} ${staff.lastName}`).toLowerCase().includes(searchQuery.toLowerCase()) 
    && (selectedRole === "All" || staff.role === selectedRole)
  );

  const handleAddStaff = async (staffData) => {
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...staffData, landlordId: session.user.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to add staff member");
      }

      fetchStaff();
      setNotification({
        open: true,
        message: "Staff member added successfully",
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  const handleEditStaff = (staff) => {
    setSelectedStaff(staff);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedStaffData) => {
    try {
      const response = await fetch(`/api/staff/${selectedStaff._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedStaffData),
      });

      if (!response.ok) {
        throw new Error("Failed to update staff member");
      }

      await fetchStaff();
      setEditModalOpen(false);
      setSelectedStaff(null);
      setNotification({
        open: true,
        message: "Staff member updated successfully",
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  const handleDeleteStaff = async (staffId) => {
    setStaffToDelete(staffId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/staff/${staffToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete staff member");
      }

      fetchStaff();
      setDeleteModalOpen(false);
      setStaffToDelete(null);
      setNotification({
        open: true,
        message: "Staff member deleted successfully",
        severity: "success",
      });
    } catch (error) {
      setNotification({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold mb-6">Staff Management</h1>
          <div className="space-x-2">
            <Link href="/staffs/add">
              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ color: "white" }} />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 3,
                  bgcolor: "#898F63",
                  "&:hover": {
                    bgcolor: "#7C8F59",
                  },
                  color: "white",
                }}
              >
                Add New Staff
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <TextField
            placeholder="Search staff by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: '300px',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#898F63',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#898F63',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#898F63' }} />
                </InputAdornment>
              ),
            }}
          />
          <div className="flex space-x-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`px-4 py-2 rounded-lg ${
                  selectedRole === role.id
                    ? "bg-[#898F63] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-[#898F63] hover:text-white"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <StaffList
          staffData={filteredStaff}
          selectedRole={selectedRole}
          searchQuery={searchQuery}
          onEdit={handleEditStaff}
          onDelete={handleDeleteStaff}
        />
      )}

      <Dialog 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#898F63',
          fontSize: '1.5rem',
          fontWeight: 600,
          p: 0,
          mb: 3
        }}>    
          Edit Staff Member
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'visible' }}>
          {selectedStaff && (
            <StaffForm
              initialData={selectedStaff}
              onSubmit={handleSaveEdit}
              onCancel={() => setEditModalOpen(false)}
              submitButtonText="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{
          color: '#898F63',
          fontSize: '1.5rem',
          fontWeight: 600,
        }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <p>Are you sure you want to delete this staff member?</p>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteModalOpen(false)}
            sx={{
              color: 'gray',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete}
            sx={{
              bgcolor: '#dc2626',
              color: 'white',
              '&:hover': {
                bgcolor: '#b91c1c'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default StaffPage;
