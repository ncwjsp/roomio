"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StaffForm from "@/app/staffs/components/StaffForm";
import Notification from "@/app/ui/notification";

const AddStaffPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const handleAddStaff = async (formData) => {
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          landlordId: session.user.id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add staff member");
      }

      showNotification("Staff member added successfully", "success");
      // Redirect after successful addition
      setTimeout(() => {
        router.push("/staffs");
      }, 2000);
    } catch (error) {
      console.error("Staff save error:", error);
      showNotification(error.message, "error");
    }
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Add New Staff</h1>
          </div>

          <StaffForm
            onSubmit={handleAddStaff}
            onCancel={() => router.push("/staffs")}
          />
        </div>
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

export default AddStaffPage;
