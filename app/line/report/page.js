"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";

export default function Report() {
  const [formData, setFormData] = useState({
    buildingNo: "",
    roomNo: "",
    problemType: "",
    details: "",
    image: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, image: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);

    // Optional: Send data to server or use LIFF message APIs
    if (liffInitialized) {
      alert("Form submitted!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-4 font-sans">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center">
          <h1 className="text-2xl font-bold mb-5">Problem Report</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Building and Room Number */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block font-medium mb-1">Building No.</label>
              <input
                type="text"
                name="buildingNo"
                placeholder="Enter building number"
                value={formData.buildingNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">Room No.</label>
              <input
                type="text"
                name="roomNo"
                placeholder="Enter room number"
                value={formData.roomNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
          </div>

          {/* Problem Type */}
          <div>
            <label className="block font-medium mb-1">Type of problem</label>
            <select
              name="problemType"
              value={formData.problemType}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Choose the type</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="cleaning">Cleaning</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Details */}
          <div>
            <label className="block font-medium mb-1">Details</label>
            <textarea
              name="details"
              placeholder="Tell more about the problem"
              value={formData.details}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-medium mb-1">Upload an image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
