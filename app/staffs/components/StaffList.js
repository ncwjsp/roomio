const StaffList = ({ staffData, selectedRole, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(staffData[selectedRole] || []).map((staff) => (
        <div key={staff._id} className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {staff.firstName} {staff.lastName}
              </h3>
              <p className="text-gray-500">{staff.role}</p>
              {staff.building && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Building {staff.building}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(staff)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(staff._id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Contact Info:</p>
                <p>Phone: {staff.phone}</p>
                <p>Email: {staff.email}</p>
                <p>LINE ID: {staff.lineId}</p>
              </div>
              <div>
                <p className="font-medium">Employment Info:</p>
                <p>
                  Start Date: {new Date(staff.startDate).toLocaleDateString()}
                </p>
                <p>Salary: ฿{staff.salary.toLocaleString()}</p>
              </div>
            </div>

            {/* Role-specific information */}
            {staff.specialization && (
              <div className="mt-2">
                <p className="font-medium">Specialization:</p>
                <p>{staff.specialization}</p>
              </div>
            )}

            {staff.role === "Housekeeper" && (
              <div className="mt-2">
                <p className="font-medium">Assigned Building:</p>
                <p>Building {staff.building}</p>
              </div>
            )}

            {(staff.role === "Housekeeper" || staff.role === "Technician") &&
              staff.lineUserId && (
                <div className="mt-2">
                  <p className="font-medium">LINE Service Account:</p>
                  <p>Connected ✓</p>
                </div>
              )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StaffList;
