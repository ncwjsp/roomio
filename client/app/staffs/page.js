"use client";

import React, { useState } from 'react';
import { Users, Clock, Wrench, ArrowLeft, XCircle, User, Building, Briefcase, DollarSign, Calendar, Phone, Info, UserRound, PlusCircle } from 'lucide-react';
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

const initialFormData = {
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
};

// StaffCard Component
const StaffCard = ({ 
  title, 
  icon, 
  isAdd = false, 
  staffCount = 0, 
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-lg p-8 flex flex-col items-center justify-center
        cursor-pointer transition-all hover:scale-105 hover:shadow-lg
        ${isAdd ? 'border-2 border-dashed border-gray-300' : 'shadow-md'}
      `}
    >
      <div className="mb-4 text-[#8b8f78]">
        {icon}
      </div>
      <h2 className="text-lg font-medium text-gray-800 mb-2">{title}</h2>
      {!isAdd && (
        <div className="flex items-center text-sm text-gray-600">
          <Users size={16} className="mr-1" />
          <span>{staffCount} members</span>
        </div>
      )}
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
  const [formData, setFormData] = useState(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'unavailable'

  const handleAddStaff = () => {
    setShowForm(true);
    setPreviewMode(false);
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
    setFormData(initialFormData);
  };

  const filteredStaffList = staffList.filter(staff =>
    staff.firstName.toLowerCase().includes(filter.toLowerCase()) ||
    staff.lastName.toLowerCase().includes(filter.toLowerCase()) ||
    staff.building.toLowerCase().includes(filter.toLowerCase()) ||
    staff.position.toLowerCase().includes(filter.toLowerCase())
  );

  // Data for overview cards
  const overviewStaffCards = [
    {
      title: "Total Staff",
      value: "90",
      iconBg: "bg-blue-100",
      icon: <Users className="text-blue-500 w-6 h-6" />,
      view: "overview"
    },
    {
      title: "Staff Overview",
      value: "Overview",
      iconBg: "bg-green-100",
      icon: <Users className="text-green-500 w-6 h-6" />,
      view: "overview"
    },
    {
      title: "Shift Information",
      value: "Details",
      iconBg: "bg-yellow-100",
      icon: <Clock className="text-yellow-500 w-6 h-6" />,
      view: "details"
    },
    {
      title: "Staff Management",
      value: "Manage",
      iconBg: "bg-red-100",
      icon: <Wrench className="text-red-500 w-6 h-6" />,
      view: "management"
    }
  ];

  const staffOverviewPieData = [
    { name: 'Housekeepers', value: 30, color: '#4CAF50' },
    { name: 'Electricians', value: 20, color: '#FFA726' },
    { name: 'Plumbers', value: 15, color: '#42A5F5' },
    { name: 'Managers', value: 10, color: '#FF7043' },
    { name: 'Technicians', value: 15, color: '#AB47BC' }
  ];

  const staffSalaryPieData = [
    { name: 'Housekeepers', value: 30000, color: '#4CAF50' },
    { name: 'Electricians', value: 40000, color: '#FFA726' },
    { name: 'Plumbers', value: 35000, color: '#42A5F5' },
    { name: 'Managers', value: 50000, color: '#FF7043' },
    { name: 'Technicians', value: 45000, color: '#AB47BC' }
  ];

  const staffDetails = [
    { name: 'John Doe', role: 'Housekeeper', available: true },
    { name: 'Jane Smith', role: 'Housekeeper', available: false },
    { name: 'Mike Johnson', role: 'Electrician', available: true },
    { name: 'Emily Davis', role: 'Electrician', available: false },
  ];

  // PieChart Component
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
                  label={({name, value}) => `${name}: ${value}`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderOverview = () => (
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

  

  const renderDetails = () => {
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
  
            {/* Electricians Section */}
            <div className="mb-8">
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-orange-800">
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
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const handleClick = (role) => {
    console.log(`${role} card clicked`);
  };

  const handleAddRole = () => {
    console.log('Add new role clicked');
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#F5F5F5]">
      <div className="w-full max-w-6xl p-5">
        <div className={`flex justify-between items-center mb-6 p-4 rounded-lg shadow-md ${activeView === "overview" ? "bg-white" : "bg-gray-100"}`}>
        
        </div>

        {activeView === "overview" && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            {renderOverview()}
          </div>
        )}
        
        {activeView === "details" && renderDetails()}

        {activeView === "management" && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <StaffCard
              title="Housekeeper"
              icon={<UserRound size={48} />}
              staffCount={4}
              onClick={() => handleClick('housekeeper')}
            />
            <StaffCard
              title="Add new role"
              icon={<PlusCircle size={48} />}
              isAdd
              onClick={handleAddRole}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPage;