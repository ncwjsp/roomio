"use client";

import React, { useState } from 'react';
import { Users, Clock, Wrench, ArrowLeft, XCircle, User, Building, Briefcase, DollarSign, Calendar, Phone, Info } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';

// Custom Card Components
const Card = ({ className, children, ...props }) => {
  return (
    <div 
      className={`border rounded-lg shadow-sm ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ className, children, ...props }) => {
  return (
    <div 
      className={`p-4 border-b ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ className, children, ...props }) => {
  return (
    <h2 
      className={`text-xl font-semibold ${className}`} 
      {...props}
    >
      {children}
    </h2>
  );
};

const CardContent = ({ children }) => {
  return (
    <div className="p-4">
      {children}
    </div>
  );
};

const StaffPage = () => {
  const [activeView, setActiveView] = useState("overview");
  const [staffList, setStaffList] = useState([
    { id: 1, building: 'A', firstName: 'Alice', lastName: 'Smith', position: 'Manager', salary: 5000 },
    { id: 2, building: 'B', firstName: 'Bob', lastName: 'Johnson', position: 'Engineer', salary: 4000 },
    { id: 3, building: 'A', firstName: 'Charlie', lastName: 'Brown', position: 'Technician', salary: 3000 }
  ]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    building: '',
    firstName: '',
    lastName: '',
    position: '',
    salary: '',
    gender: '',
    age: '',
    dateOfBirth: '',
    firstDayOfWork: '',
    lineId: '',
    phone: ''
  });

  const handleAddStaff = () => {
    setShowForm(true);
  };

  const handleDeleteStaff = (id) => {
    setStaffList(staffList.filter(staff => staff.id !== id));
  };

  const handleEditStaff = (id) => {
    // Logic to edit staff details
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPreviewMode(true);
  };

  const handleConfirm = () => {
    setStaffList([...staffList, { ...formData, id: staffList.length + 1 }]);
    setShowForm(false);
    setPreviewMode(false);
    setFormData({
      id: '',
      building: '',
      firstName: '',
      lastName: '',
      position: '',
      salary: '',
      gender: '',
      age: '',
      dateOfBirth: '',
      firstDayOfWork: '',
      lineId: '',
      phone: ''
    });
  };

  const filteredStaffList = staffList.filter(staff =>
    staff.firstName.toLowerCase().includes(filter.toLowerCase()) ||
    staff.lastName.toLowerCase().includes(filter.toLowerCase()) ||
    staff.building.toLowerCase().includes(filter.toLowerCase()) ||
    staff.position.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card className="shadow-lg rounded-lg bg-white">
        <CardHeader className="flex justify-between items-center bg-green-600 text-white rounded-t-lg">
          <h2 className="text-xl font-bold">Staff Management List</h2>
          <button onClick={handleAddStaff} className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Add Staff</button>
        </CardHeader>
        <div className="p-4">
          <input
            type="text"
            placeholder="Filter by name, building, or position..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-4 p-2 border rounded-lg w-full"
          />
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b">Building</th>
                  <th className="py-2 px-4 border-b">First Name</th>
                  <th className="py-2 px-4 border-b">Last Name</th>
                  <th className="py-2 px-4 border-b">Position</th>
                  <th className="py-2 px-4 border-b">Salary/Month</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffList.map((staff, index) => (
                  <tr key={staff.id} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                    <td className="py-2 px-4">{staff.building}</td>
                    <td className="py-2 px-4">{staff.firstName}</td>
                    <td className="py-2 px-4">{staff.lastName}</td>
                    <td className="py-2 px-4">{staff.position}</td>
                    <td className="py-2 px-4">${staff.salary}</td>
                    <td className="py-2 px-4">
                      <button onClick={() => handleEditStaff(staff.id)} className="bg-yellow-500 hover:bg-yellow-700 text-white px-2 py-1 rounded-lg mr-2">Edit</button>
                      <button onClick={() => handleDeleteStaff(staff.id)} className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded-lg">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <XCircle className="w-6 h-6" />
            </button>
            {previewMode ? (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center">Preview Staff Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>ID:</strong> {formData.id}</div>
                  <div><strong>Building:</strong> {formData.building}</div>
                  <div><strong>First Name:</strong> {formData.firstName}</div>
                  <div><strong>Last Name:</strong> {formData.lastName}</div>
                  <div><strong>Position:</strong> {formData.position}</div>
                  <div><strong>Salary:</strong> ${formData.salary}</div>
                  <div><strong>Gender:</strong> {formData.gender}</div>
                  <div><strong>Age:</strong> {formData.age}</div>
                  <div><strong>Date of Birth:</strong> {formData.dateOfBirth}</div>
                  <div><strong>First Day of Work:</strong> {formData.firstDayOfWork}</div>
                  <div><strong>Line ID:</strong> {formData.lineId}</div>
                  <div><strong>Phone:</strong> {formData.phone}</div>
                </div>
                <div className="flex justify-end mt-6">
                  <button type="button" onClick={() => setPreviewMode(false)} className="bg-yellow-500 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg mr-2">Go Back</button>
                  <button type="button" onClick={handleConfirm} className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Confirm</button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center">Add New Staff</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">ID</label>
                      <div className="flex items-center">
                        <User className="mr-2 text-gray-500" />
                        <input
                          type="text"
                          name="id"
                          value={formData.id}
                          onChange={handleChange}
                          placeholder="Enter ID"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">Building</label>
                      <div className="flex items-center">
                        <Building className="mr-2 text-gray-500" />
                        <input
                          type="text"
                          name="building"
                          value={formData.building}
                          onChange={handleChange}
                          placeholder="Enter Building"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">First Name</label>
                      <div className="flex items-center">
                        <User className="mr-2 text-gray-500" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Enter First Name"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">Last Name</label>
                      <div className="flex items-center">
                        <User className="mr-2 text-gray-500" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Enter Last Name"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">Position</label>
                      <div className="flex items-center">
                        <Briefcase className="mr-2 text-gray-500" />
                        <input
                          type="text"
                          name="position"
                          value={formData.position}
                          onChange={handleChange}
                          placeholder="Enter Position"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">Salary</label>
                      <div className="flex items-center">
                        <DollarSign className="mr-2 text-gray-500" />
                        <input
                          type="number"
                          name="salary"
                          value={formData.salary}
                          onChange={handleChange}
                          placeholder="Enter Salary"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">Gender</label>
                      <div className="flex items-center">
                        <User className="mr-2 text-gray-500" />
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">Age</label>
                      <div className="flex items-center">
                        <User className="mr-2 text-gray-500" />
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          placeholder="Enter Age"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">Date of Birth</label>
                      <div className="flex items-center">
                        <Calendar className="mr-2 text-gray-500" />
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">First Day of Work</label>
                      <div className="flex items-center">
                        <Calendar className="mr-2 text-gray-500" />
                        <input
                          type="date"
                          name="firstDayOfWork"
                          value={formData.firstDayOfWork}
                          onChange={handleChange}
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">Line ID</label>
                      <div className="flex items-center">
                        <Info className="mr-2 text-gray-500" />
                        <input
                          type="text"
                          name="lineId"
                          value={formData.lineId}
                          onChange={handleChange}
                          placeholder="Enter Line ID"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-semibold mb-2">Phone</label>
                      <div className="flex items-center">
                        <Phone className="mr-2 text-gray-500" />
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter Phone"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button type="button" onClick={() => setShowForm(false)} className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded-lg mr-2">Cancel</button>
                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Done</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;