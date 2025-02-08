"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function MaintenanceServicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    problem: "",
    description: "",
    images: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const problemTypes = [
    "Plumbing",
    "Electrical",
    "Cleaning",
    "Furniture",
    "Other",
  ];

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/s3-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      return `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${data.fileName}`;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Upload images first if any
      const imageFiles = formData.images;
      const uploadedImages = [];

      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const imageUrl = await uploadImage(file);
          uploadedImages.push(imageUrl);
        }
      }

      // Submit maintenance request with image URLs
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem: formData.problem,
          description: formData.description,
          images: uploadedImages,
          tenantId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      router.push("/line/maintenance");
      router.refresh();
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update image handling
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      images: files,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="text-2xl font-bold mb-6">Maintenance Request</header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Problem Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Problem Type
          </label>
          <select
            value={formData.problem}
            onChange={(e) =>
              setFormData({ ...formData, problem: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#889F63] focus:border-transparent"
            required
          >
            <option value="">Select problem type</option>
            {problemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-[#889F63] focus:border-transparent"
            placeholder="Please describe the problem in detail"
            required
          />
        </div>

        {/* Image Upload - Optional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#889F63] focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-[#889F63] text-white py-3 rounded-lg font-medium shadow-sm 
            ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#7A8F53]"
            } 
            transition-colors`}
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
