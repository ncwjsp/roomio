"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { ChevronLeft } from "@mui/icons-material";
import Loading from "../components/loading";
import { CircularProgress } from "@mui/material";

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

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const { searchParams } = new URL(window.location.href);
        const id = searchParams.get("id");

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
        return data.url;
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
        <div className="min-h-screen flex items-center justify-center">
          <CircularProgress size={32} sx={{ color: '#889F63' }} />
        </div>
      ) : error ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen">
          {/* Header */}
          <div className="shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-6">
              <h1 className="text-2xl font-bold text-[#898F63]">
                Maintenance Requests
              </h1>
              <button
                onClick={() => setShowNewRequestModal(true)}
                className="mt-4 bg-[#889F63] text-white px-6 py-2.5 rounded-lg inline-flex items-center shadow-sm hover:bg-[#7A8F53] transition-colors font-medium"
              >
                + New Request
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="space-y-4">
              {!tickets?.length ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <p className="text-gray-600 mb-6">
                      No maintenance requests found. Create your first request to get started.
                    </p>
                    <button
                      onClick={() => setShowNewRequestModal(true)}
                      className="bg-[#889F63] text-white px-6 py-3 rounded-lg inline-flex items-center shadow-sm hover:bg-[#7A8F53] transition-colors font-medium"
                    >
                      + Create Your First Request
                    </button>
                  </div>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    onClick={() => handleTicketClick(ticket)}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {ticket.problem}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          ticket.currentStatus
                        )}`}
                      >
                        {ticket.currentStatus}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      Room {ticket.room?.roomNumber}
                    </div>

                    <div className="text-sm text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {ticket.createdAt &&
                        format(new Date(ticket.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detail Modal */}
          {showDetailModal && selectedTicket && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedTicket.problem}
                      </h2>
                      <p className="text-gray-600 mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Room {selectedTicket.room?.roomNumber}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        selectedTicket.currentStatus
                      )}`}
                    >
                      {selectedTicket.currentStatus}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Images */}
                  {selectedTicket.images?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Images
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedTicket.images.map((image, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-sm">
                            <Image
                              src={image.url}
                              alt={`Maintenance image ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              priority={index === 0}
                              className="object-cover hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status History */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Status History
                    </h3>
                    <div className="space-y-4">
                      {selectedTicket.statusHistory?.map((status, index) => (
                        <div
                          key={index}
                          className="flex items-start border-l-2 border-gray-200 pl-4 relative"
                        >
                          <div className="absolute -left-1.5 mt-1.5">
                            <div className="h-3 w-3 rounded-full bg-[#889F63]"></div>
                          </div>
                          <div className="flex-1 ml-2">
                            <p className="text-sm font-medium text-gray-900">
                              {status.status}
                            </p>
                            {status.comment && (
                              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                                {status.comment}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
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
                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    New Maintenance Request
                  </h2>
                  <form onSubmit={handleSubmitRequest} className="space-y-6">
                    <div>
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#889F63] focus:border-transparent transition-shadow"
                        placeholder="Enter the main issue"
                        required
                      />
                    </div>
                    <div>
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#889F63] focus:border-transparent transition-shadow"
                        rows={4}
                        placeholder="Provide detailed description of the issue"
                        required
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Images
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#889F63] transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={uploadingImages}
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer"
                        >
                          <div className="mx-auto w-12 h-12 mb-3 text-gray-400">
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-[#889F63] hover:text-[#7A8F53] font-medium transition-colors">
                            Click to upload images
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            or drag and drop your files here
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            PNG, JPG up to 10MB each
                          </p>
                        </label>
                      </div>
                      {uploadingImages && (
                        <div className="mt-4 bg-[#889F63] bg-opacity-10 text-[#889F63] p-4 rounded-lg flex items-center">
                          <CircularProgress size={16} className="mr-3" sx={{ color: '#889F63' }} />
                          <span className="text-sm font-medium">Uploading your images...</span>
                        </div>
                      )}

                      {/* Image Previews */}
                      {previewImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {previewImages.map((preview, index) => (
                            <div key={index} className="relative rounded-lg overflow-hidden shadow-sm group">
                              <Image
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                width={200}
                                height={200}
                                className="object-cover w-full h-full"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              >
                                ×
                              </button>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t">
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
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingImages}
                        className={`bg-[#889F63] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#7A8F53] transition-colors ${
                          uploadingImages ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Suspense>
  );
};

export default MaintenancePage;
