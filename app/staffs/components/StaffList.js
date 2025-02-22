import { Pagination, Box, IconButton, Tooltip } from "@mui/material";
import { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const StaffList = ({ staffData, selectedRole, onEdit, onDelete }) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;  

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredStaff = staffData.filter(staff => 
    (selectedRole === "All" || staff.role === selectedRole)
  );

  if (filteredStaff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-100">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Staff Found</h3>
        <p className="text-gray-500 text-center">
          {selectedRole === "All"
            ? "There are no staff members yet. Add your first staff member to get started!"
            : `There are no ${selectedRole.toLowerCase()} staff members. Try selecting a different role or add a new staff member.`}
        </p>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStaff.map((staff) => (
                <tr key={staff._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {staff.firstName} {staff.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full
                      ${staff.role === 'Housekeeper' ? 'bg-blue-100 text-blue-800' : 
                        staff.role === 'Technician' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Tooltip title="Edit staff">
                      <IconButton 
                        onClick={() => onEdit(staff)}
                        size="small"
                        sx={{ 
                          color: '#4B5563',
                          '&:hover': { 
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563EB'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete staff">
                      <IconButton
                        onClick={() => onDelete(staff._id)}
                        size="small"
                        sx={{ 
                          color: '#4B5563',
                          '&:hover': { 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#DC2626'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#898F63',
              },
              '& .Mui-selected': {
                backgroundColor: '#898F63 !important',
                color: 'white !important',
              },
              '& .MuiPaginationItem-root:hover': {
                backgroundColor: 'rgba(137, 143, 99, 0.1)',
              },
            }}
          />
        </Box>
      )}
    </div>
  );
};

export default StaffList;
