"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { ChevronLeft } from "@mui/icons-material";
import Loading from "./loading";

const MaintenancePage = () => {
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [landlordId, setLandlordId] = useState(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newRequest, setNewRequest] = useState({
    problem: "",
    description: "",
    images: [],
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  // Add these console logs to debug environment variables
  console.log("Bucket:", process.env.AWS_BUCKET_NAME);
  console.log("Region:", process.env.AWS_REGION);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const { searchParams } = new URL(window.location.href);
        const id = searchParams.get("id"); // landlord's id

        if (!id) {
          throw new Error("ID not provided in URL");
        }

        setLandlordId(id);

        const response = await fetch(`/api/user/line-config?id=${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch line configuration');
        }
        const { lineConfig } = await response.json();
        console.log("Line config response:", lineConfig);

        if (!lineConfig?.liffIds?.maintenance) {
          throw new Error("LIFF ID not configured for maintenance feature");
        }

        const liffId = lineConfig.liffIds.maintenance;
        if (!liffId) {
          throw new Error("LIFF ID not configured for maintenance feature");
        }

        const liff = (await import("@line/liff")).default;
        await liff.init({
          liffId: liffId,
        });

        if (!liff.isLoggedIn()) {
          await liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setUserId(profile.userId);

        // Fetch maintenance tickets for this tenant
        fetchMaintenanceByLineIdAndLandlord(profile.userId, id);
      } catch (error) {
        console.error("Failed to initialize LIFF:", error);
        setError("Failed to initialize LINE login");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchMaintenanceByLineIdAndLandlord = async (
      lineUserId,
      landlordId
    ) => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/maintenance?lineUserId=${lineUserId}&landlordId=${landlordId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch maintenance tickets");
        }

        const data = await response.json();
        setTickets(data.tickets || []);
      } catch (error) {
        console.error("Failed to fetch maintenance tickets:", error);
        setError("Failed to load maintenance tickets");
      } finally {
        setIsLoading(false);
      }
    };

    initializeLiff();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleImageUpload = async (e) => {
    try {
      setUploadingImages(true);
      const files = Array.from(e.target.files);

      // Create preview URLs
      const previews = files.map((file) => URL.createObjectURL(file));
      setPreviewImages((prev) => [...prev, ...previews]);

      // Upload each file to S3
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/s3-upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${data.fileName}`;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setNewRequest((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      console.error("Image upload failed:", error);
      setError("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setNewRequest((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newRequest,
          lineUserId: userId,
          landlordId: landlordId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create maintenance request");
      }

      // Refresh the tickets list
      const updatedResponse = await fetch(
        `/api/maintenance?lineUserId=${userId}&landlordId=${landlordId}`
      );
      const updatedData = await updatedResponse.json();
      setTickets(updatedData.tickets || []);

      // Reset form and close modal
      setShowNewRequestModal(false);
      setNewRequest({ problem: "", description: "", images: [] });
      setPreviewImages([]);
    } catch (error) {
      console.error("Error creating request:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  return (
    <Suspense fallback={<Loading />}>
      {isLoading || !tickets ? (
        <Loading />
      ) : error ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen p-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Maintenance Requests
            </h1>
            <button
              onClick={() => setShowNewRequestModal(true)}
              className="bg-[#889F63] text-white px-4 py-2 rounded-lg inline-block shadow-sm hover:bg-[#7A8F53] transition-colors"
            >
              New Request
            </button>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            {!tickets?.length ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  No maintenance requests found
                </p>
                <button
                  onClick={() => setShowNewRequestModal(true)}
                  className="bg-[#889F63] text-white px-6 py-3 rounded-lg inline-block shadow-sm hover:bg-[#7A8F53] transition-colors"
                >
                  Create Your First Maintenance Request
                </button>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  onClick={() => handleTicketClick(ticket)}
                  className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {ticket.problem}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                        ticket.currentStatus
                      )}`}
                    >
                      {ticket.currentStatus}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    Room {ticket.room?.roomNumber}
                  </div>

                  <div className="text-sm text-gray-500">
                    {ticket.createdAt &&
                      format(new Date(ticket.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Modal */}
          {showDetailModal && selectedTicket && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedTicket.problem}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Room {selectedTicket.room?.roomNumber}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                        selectedTicket.currentStatus
                      )}`}
                    >
                      {selectedTicket.currentStatus}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-600">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Images */}
                  {selectedTicket.images?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Images
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedTicket.images.map((image, index) => {
                          // Construct the full S3 URL
                          const imageUrl = image.url;
                          console.log("Image URL:", imageUrl); // Debug log

                          return (
                            <div key={index} className="relative aspect-square">
                              <Image
                                src={imageUrl}
                                alt={`Maintenance image ${index + 1}`}
                                fill
                                className="rounded-lg object-cover"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Status History */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Status History
                    </h3>
                    <div className="space-y-3">
                      {selectedTicket.statusHistory?.map((status, index) => (
                        <div
                          key={index}
                          className="flex items-start border-l-2 border-gray-200 pl-4 pb-4 relative"
                        >
                          <div className="absolute -left-1.5 mt-1.5">
                            <div className="h-3 w-3 rounded-full bg-gray-200"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {status.status}
                            </p>
                            {status.comment && (
                              <p className="text-sm text-gray-600 mt-1">
                                {status.comment}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {format(
                                new Date(status.updatedAt),
                                "MMM d, yyyy HH:mm"
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Request Modal */}
          {showNewRequestModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">
                  New Maintenance Request
                </h2>
                <form onSubmit={handleSubmitRequest}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Problem
                    </label>
                    <input
                      type="text"
                      value={newRequest.problem}
                      onChange={(e) =>
                        setNewRequest((prev) => ({
                          ...prev,
                          problem: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newRequest.description}
                      onChange={(e) =>
                        setNewRequest((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded-lg"
                      rows={4}
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Images
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="w-full"
                      disabled={uploadingImages}
                    />
                    {uploadingImages && (
                      <div className="text-sm text-gray-500 mt-1">
                        Uploading images...
                      </div>
                    )}

                    {/* Image Previews */}
                    {previewImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {previewImages.map((preview, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              width={150}
                              height={150}
                              className="rounded-lg object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewRequestModal(false);
                        setNewRequest({
                          problem: "",
                          description: "",
                          images: [],
                        });
                        setPreviewImages([]);
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingImages}
                      className={`bg-[#889F63] text-white px-4 py-2 rounded-lg hover:bg-[#7A8F53] ${
                        uploadingImages ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </Suspense>
  );
};

export default MaintenancePage;
