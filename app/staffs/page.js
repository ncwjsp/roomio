"use client"
import React, { useState, useEffect } from "react";
import { Users, Clock, Wrench, ArrowLeft } from "lucide-react";

const StaffPage = () => {
  const [activeView, setActiveView] = useState("overview");
  const [staffList, setStaffList] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    building: "",
    position: "",
    salary: "",
    gender: "",
    age: "",
    dateOfBirth: "",
    firstDayOfWork: "",
    lineId: "",
    phone: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  // Fetch staff data
  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      setStaffList(data);
    } catch (error) {
      console.error(error.message);
    }
  };

  // Add new staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to add staff");
      fetchStaff();
      setFormData({
        firstName: "",
        lastName: "",
        building: "",
        position: "",
        salary: "",
        gender: "",
        age: "",
        dateOfBirth: "",
        firstDayOfWork: "",
        lineId: "",
        phone: "",
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  // Edit existing staff
  const handleEditStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingStaffId, updates: formData }),
      });
      if (!res.ok) throw new Error("Failed to update staff");
      fetchStaff();
      setIsEditing(false);
      setEditingStaffId(null);
      setFormData({
        firstName: "",
        lastName: "",
        building: "",
        position: "",
        salary: "",
        gender: "",
        age: "",
        dateOfBirth: "",
        firstDayOfWork: "",
        lineId: "",
        phone: "",
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  // Delete staff
  const handleDeleteStaff = async (id) => {
    try {
      const res = await fetch("/api/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) throw new Error("Failed to delete staff");
      fetchStaff();
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-6xl p-5">
        {activeView === "overview" && (
          <div>
            <h1 className="text-3xl font-semibold mb-6">Staff Overview</h1>
            <div>
              <button onClick={() => setActiveView("add")} className="p-2 bg-blue-500 text-white rounded">
                Add Staff
              </button>
              <div className="grid grid-cols-3 gap-4 mt-4">
                {staffList.map((staff) => (
                  <div key={staff._id} className="p-4 bg-white rounded shadow">
                    <h3 className="font-semibold">
                      {staff.firstName} {staff.lastName}
                    </h3>
                    <p>{staff.position}</p>
                    <p>{staff.building}</p>
                    <p>Salary: ${staff.salary}</p>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => {
                          setFormData(staff);
                          setIsEditing(true);
                          setEditingStaffId(staff._id);
                          setActiveView("add");
                        }}
                        className="p-2 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staff._id)}
                        className="p-2 bg-red-500 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeView === "add" && (
          <form onSubmit={isEditing ? handleEditStaff : handleAddStaff} className="p-4 bg-white rounded shadow">
            <h2 className="text-2xl font-semibold mb-4">{isEditing ? "Edit Staff" : "Add Staff"}</h2>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="text"
              name="building"
              placeholder="Building"
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="text"
              name="position"
              placeholder="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="number"
              name="salary"
              placeholder="Salary"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full p-2 mb-4 border rounded"
            />
            <div className="flex space-x-4">
              <button type="submit" className="p-2 bg-green-500 text-white rounded">
                {isEditing ? "Save Changes" : "Add Staff"}
              </button>
              <button
                type="button"
                onClick={() => setActiveView("overview")}
                className="p-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StaffPage;
