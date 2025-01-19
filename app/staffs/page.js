"use client";

import { useState, useEffect } from "react";

const StaffPage = () => {
  const roles = ["Housekeeper", "Electrician", "Plumber", "Manager", "Technician"];
  const [staffData, setStaffData] = useState({});
  const [selectedRole, setSelectedRole] = useState("Housekeeper");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    building: "",
    position: "",
    salary: "",
    role: "Housekeeper",
  });

  const fetchStaffByRole = async (role) => {
    try {
      const res = await fetch(`/api/staff?role=${role}`);
      if (!res.ok) throw new Error(`Failed to fetch ${role}s`);
      const data = await res.json();
      setStaffData((prev) => ({ ...prev, [role]: data }));
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    fetchStaffByRole(selectedRole);
  }, [selectedRole]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to add staff");
      setFormData({ firstName: "", lastName: "", building: "", position: "", salary: "", role: selectedRole });
      fetchStaffByRole(selectedRole);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      const res = await fetch("/api/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) throw new Error("Failed to delete staff");
      fetchStaffByRole(selectedRole);
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Staff Management</h1>

      <div className="flex gap-4 mb-6">
        {roles.map((role) => (
          <button
            key={role}
            className={`px-4 py-2 rounded ${selectedRole === role ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setSelectedRole(role)}
          >
            {role}s
          </button>
        ))}
      </div>

      {/* Add Staff Form */}
      <form onSubmit={handleAddStaff} className="mb-6">
        <input
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Building"
          value={formData.building}
          onChange={(e) => setFormData({ ...formData, building: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Position"
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
        />
        <input
          type="number"
          placeholder="Salary"
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
        />
        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
          Add Staff
        </button>
      </form>

      {/* Staff List */}
      <div>
        <h2 className="text-xl font-bold mb-4">{selectedRole}s</h2>
        <ul>
          {(staffData[selectedRole] || []).map((staff) => (
            <li key={staff._id} className="p-4 border rounded mb-2 flex justify-between">
              <div>
                <p>
                  <strong>{staff.firstName} {staff.lastName}</strong> - {staff.position}
                </p>
                <p>Building: {staff.building}</p>
                <p>Salary: ${staff.salary}</p>
              </div>
              <button
                onClick={() => handleDeleteStaff(staff._id)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StaffPage;
