"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CircularProgress } from "@mui/material";
import Notification from "@/app/ui/notification";
import StaffList from "@/app/staffs/components/StaffList";
import Link from "next/link";

const StaffPage = () => {
  const { data: session } = useSession();
  const [staffData, setStaffData] = useState({});
  const [selectedRole, setSelectedRole] = useState("Housekeeper");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Form states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: "Housekeeper",
    specialization: "", // For technicians
    salary: "",
    startDate: "",
    status: "Active",
  });

  // New role form state
  const [newRole, setNewRole] = useState({
    name: "",
    category: "General", // or "Technical"
  });

  const [roles] = useState([
    { id: "Housekeeper", label: "Housekeeper" },
    { id: "Technician", label: "Technician" },
    { id: "General", label: "General Staff" },
  ]);

  useEffect(() => {
    if (session) {
      fetchStaffByRole(selectedRole);
    }
  }, [session, selectedRole]);

  const fetchStaffByRole = async (role) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/staff?role=${role}`);
      if (!res.ok) throw new Error(`Failed to fetch ${role}s`);
      const data = await res.json();
      setStaffData((prev) => ({ ...prev, [role]: data }));
    } catch (error) {
      setError(error.message);
      showNotification(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, landlordId: session.user.id }),
      });

      if (!res.ok) throw new Error("Failed to add staff member");

      showNotification("Staff member added successfully", "success");
      fetchStaffByRole(formData.role);
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  const handleEditStaff = async (staffId, updatedData) => {
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error("Failed to update staff member");

      showNotification("Staff member updated successfully", "success");
      fetchStaffByRole(selectedRole);
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete staff member");

      showNotification("Staff member deleted successfully", "success");
      fetchStaffByRole(selectedRole);
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      role: "Housekeeper",
      specialization: "",
      salary: "",
      startDate: "",
      status: "Active",
    });
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000
    );
  };

  return (
    <div className="min-h-screen bg-[#EBECE1] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <div className="space-x-2">
            <Link
              href="/staffs/add"
              className="px-4 py-2 bg-[#898F63] text-white rounded-lg hover:bg-[#6B7355]"
            >
              Add Staff Member
            </Link>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedRole === role.id
                  ? "bg-[#898F63] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* Staff List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <CircularProgress sx={{ color: "#898F63" }} />
          </div>
        ) : (
          <StaffList
            staffData={staffData}
            selectedRole={selectedRole}
            onEdit={(staff) => {
              setFormData(staff);
            }}
            onDelete={handleDeleteStaff}
          />
        )}
      </div>

      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() =>
            setNotification({ show: false, message: "", type: "" })
          }
        />
      )}
    </div>
  );
};

export default StaffPage;
