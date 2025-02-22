"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

// Loading Spinner Component
const LoadingSpinner = () => {
  return (
    <div className="w-16 h-16 inline-block overflow-hidden bg-transparent">
      <div className="w-full h-full relative transform scale-100 origin-[0_0]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute left-[30px] top-[16px] w-[3px] h-[8px] rounded-[2px] bg-[#898f63] origin-[2px_20px]"
            style={{
              transform: `rotate(${i * 30}deg)`,
              animation: `spinner-fade 1s linear infinite`,
              animationDelay: `${-0.0833 * (12 - i)}s`
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes spinner-fade {
          0% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
};


export default function RoomDetails({ params }) {
  const roomId = use(params).id;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoom, setEditedRoom] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRoomDetails();
    }
  }, [status, roomId]);

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch(`/api/room/${roomId}`);
      if (!response.ok) throw new Error("Failed to fetch room details");
      const data = await response.json();
      setRoom(data);
      setEditedRoom(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/room/${roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedRoom),
      });

      if (!response.ok) throw new Error("Failed to update room");

      setRoom(editedRoom);
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: "Room updated successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    }
  };

  const handleCancel = () => {
    setEditedRoom(room);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/room/${room._id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete room");
      }

      setSnackbar({
        open: true,
        message: "Room deleted successfully",
        severity: "success",
      });
      
      // Redirect back to building page
      router.push(`/buildings`);
    } catch (error) {
      console.error("Error deleting room:", error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#EBECE1]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#EBECE1] p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="text-red-500 text-center">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBECE1] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div
          className={`rounded-lg shadow-lg p-6 mb-6 ${
            room?.status === "Available"
              ? "bg-[#898F63] text-white"
              : room?.status === "Unavailable"
              ? "bg-red-500 text-white"
              : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1
                className={`text-3xl font-bold ${
                  room?.status === "Available" || room?.status === "Unavailable"
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                Room {room?.roomNumber}
              </h1>
              <p
                className={`mt-1 ${
                  room?.status === "Available" || room?.status === "Unavailable"
                    ? "text-white/90"
                    : "text-gray-600"
                }`}
              >
                Building {room?.floor?.building?.name} • Floor{" "}
                {room?.floor?.floorNumber}
              </p>
            </div>
            <button
              onClick={() => router.push("/buildings")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                room?.status === "Available" || room?.status === "Unavailable"
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              Back to Buildings
            </button>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#898F63] focus:border-transparent"
                  value={editedRoom.status}
                  onChange={(e) =>
                    setEditedRoom({ ...editedRoom, status: e.target.value })
                  }
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#898F63] focus:border-transparent"
                  value={editedRoom.price}
                  onChange={(e) =>
                    setEditedRoom({
                      ...editedRoom,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-white hover:bg-gray-50 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#898F63] text-white rounded-lg hover:bg-[#6B7355]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p
                    className={`mt-1 text-lg font-medium ${
                      room?.status === "Available"
                        ? "text-[#898F63]"
                        : room?.status === "Unavailable"
                        ? "text-red-500"
                        : "text-gray-900"
                    }`}
                  >
                    {room?.status}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price</h3>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    ฿{room?.price?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* New Utility Rates Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Utility Rates
                </h3>
                <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-lg p-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Electricity Rate
                    </h4>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                      ฿{room?.floor?.building?.electricityRate?.toFixed(2)}/unit
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Water Rate
                    </h4>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                      ฿{room?.floor?.building?.waterRate?.toFixed(2)}/unit
                    </p>
                  </div>
                </div>
              </div>

              {room?.tenant && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Current Tenant
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-[#898F63] flex items-center justify-center text-white">
                            {room.tenant.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {room.tenant.name}
                          </h4>
                          <p className="text-gray-500">{room.tenant.phone}</p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/tenants/${room.tenant._id}`)
                        }
                        className="px-4 py-2 text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#898F63] rounded-lg border border-[#898F63] transition-colors"
                      >
                        View Tenant
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                {room?.status !== "Occupied" && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete Room
                  </button>
                )}
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-[#898F63] text-white rounded-lg hover:bg-[#6B7355]"
                >
                  Edit Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 6 }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete room {room?.roomNumber}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            sx={{ color: "#889F63" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
