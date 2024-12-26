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

const PieChartComponent = ({ data, title }) => {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
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
    setActiveView("overview");
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

  const renderOverview = () => {
    return (
      <div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {overviewStaffCards.map((stat, index) => (
            <Card
              key={index}
              onClick={() => setActiveView(stat.view)}
              className={`flex justify-between items-center p-4 cursor-pointer transition-all 
                ${activeView === stat.view 
                  ? "border-blue-500 border-2 scale-105" 
                  : "hover:border-gray-300"}`}
            >
              <div>
                <h3 className="text-sm text-gray-500">{stat.title}</h3>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${stat.iconBg}`}>
                {stat.icon}
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <PieChartComponent
            data={staffOverviewPieData}
            title="Staff Overview by Role"
          />
          <PieChartComponent
            data={staffSalaryPieData}
            title="Staff Salaries by Role"
          />
        </div>
      </div>
    );
  };

  const renderManagement = () => {
    return (
      <div>
        {/* Your management content */}
      </div>
    );
  };

  const renderDetails = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'unavailable'
    
    const housekeepers = staffDetails.filter(staff => staff.role === 'Housekeeper');
    const electricians = staffDetails.filter(staff => staff.role === 'Electrician');
  
    const filterStaff = (staff) => {
      const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAvailability = 
        availabilityFilter === 'all' ? true :
        availabilityFilter === 'available' ? staff.available :
        !staff.available;
      
      return matchesSearch && matchesAvailability;
    };
  
    const filteredElectricians = electricians.filter(filterStaff);
    const filteredHousekeepers = housekeepers.filter(filterStaff);
  
    return (
      <div className="w-full">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => setActiveView("overview")} 
            className="flex items-center text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2"
          >
            <ArrowLeft className="mr-2" /> Back to Overview
          </button>
        </div>
        <Card className="p-6 shadow-lg rounded-lg bg-white">
          <CardContent>
            {/* Filter Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  placeholder="Search staff by name..."
                  className="flex-1 p-2 border rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="p-2 border rounded-lg"
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                >
                  <option value="all">All Staff</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
            {/* Housekeepers Section */}
            <div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-green-800">
                  Housekeepers ({filteredHousekeepers.length})
                </h3>
                <div className="space-y-3">
                  {filteredHousekeepers.map((staff, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg shadow-sm bg-white">
                      <div>
                        <p className="text-lg font-medium">{staff.name}</p>
                        <p className="text-gray-600">{staff.role}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-white ${staff.available ? 'bg-green-500' : 'bg-red-500'}`}>
                        {staff.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  ))}
                  {filteredHousekeepers.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No housekeepers match the filters</p>
                  )}
                </div>
              </div>
            </div>
            {/* Electricians Section */}
            <div>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-yellow-800">
                  Electricians ({filteredElectricians.length})
                </h3>
                <div className="space-y-3">
                  {filteredElectricians.map((staff, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg shadow-sm bg-white">
                      <div>
                        <p className="text-lg font-medium">{staff.name}</p>
                        <p className="text-gray-600">{staff.role}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-white ${staff.available ? 'bg-green-500' : 'bg-red-500'}`}>
                        {staff.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  ))}
                  {filteredElectricians.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No electricians match the filters</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#F5F5F5]">
      <div className="w-full max-w-6xl p-5">
        <div className={`flex justify-between items-center mb-6 p-4 rounded-lg shadow-md ${activeView === "overview" ? "bg-white" : "bg-gray-100"}`}>
          <h1 className="text-3xl font-semibold">
            {activeView === "overview" 
              ? "Staff Overview" 
              : activeView === "management" 
                ? "Staff Management" 
                : "Staff Details"}
          </h1>
        </div>

        {activeView === "overview" && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            {renderOverview()}
          </div>
        )}
        {activeView === "management" && renderManagement()} 
        {activeView === "details" && renderDetails()}
      </div>

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
                          placeholder="Enter Date of Birth"
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
                          placeholder="Enter First Day of Work"
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