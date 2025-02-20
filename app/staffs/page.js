"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CircularProgress } from "@mui/material";
import Notification from "@/app/ui/notification";
import StaffList from "@/app/staffs/components/StaffList";
import Link from "next/link";

const StaffPage = () => {
  const { data: session } = useSession();
  const [staffData, setStaffData] = useState([]);
  const [selectedRole, setSelectedRole] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const [roles] = useState([
    { id: "All", label: "All" },
    { id: "Housekeeper", label: "Housekeeper" },
    { id: "Technician", label: "Technician" },
    { id: "General", label: "General Staff" },
  ]);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!session?.user?.id) return;
      
      try {
        setIsLoading(true);
        const res = await fetch('/api/staff');
        if (!res.ok) throw new Error('Failed to fetch staff');
        const data = await res.json();
        setStaffData(data);
      } catch (error) {
        console.error('Error fetching staff:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [session?.user?.id]);

  const filteredStaff = selectedRole === "All" 
    ? staffData 
    : staffData.filter(staff => staff.role === selectedRole);

  const handleAddStaff = async (staffData) => {
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...staffData, landlordId: session.user.id }),
      });

      if (!res.ok) throw new Error("Failed to add staff member");
      const newStaff = await res.json();
      setStaffData(prev => [...prev, newStaff]);
      showNotification("Staff member added successfully", "success");
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
      const updatedStaff = await res.json();
      setStaffData(prev => prev.map(staff => 
        staff._id === staffId ? updatedStaff : staff
      ));
      showNotification("Staff member updated successfully", "success");
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  const handleDeleteStaff = async (staffId) => {
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete staff member");
      setStaffData(prev => prev.filter(staff => staff._id !== staffId));
      showNotification("Staff member deleted successfully", "success");
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type,
    });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold mb-6">Staff Management</h1>
          <div className="space-x-2">
            <Link
              href="/staffs/add"
              className="bg-[#898F63] text-white px-4 py-2 rounded hover:bg-[#707454]"
            >
              Add Staff
            </Link>
          </div>
        </div>

        <div className="flex space-x-2 mb-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`px-4 py-2 rounded-lg ${
                selectedRole === role.id
                  ? "bg-[#898F63] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-[#898F63]"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <CircularProgress />
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <StaffList
          staffData={filteredStaff}
          selectedRole={selectedRole}
          onEdit={handleEditStaff}
          onDelete={handleDeleteStaff}
        />
      )}

      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
};

export default StaffPage;
