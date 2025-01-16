"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/api/auth/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/login");
      } else {
        setError(data.error || "An error occurred during registration.");
      }
    } catch (err) {
      setError("Failed to register. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold">
          Room<span className="text-black">io</span>
        </h1>
        <h3 className="text-md font-semibold">Apartment Management System</h3>
        <p className="text-sm text-gray-600 mt-4">Create your account</p>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              name="firstName"
              placeholder="Firstname"
              value={formData.firstName}
              onChange={handleChange}
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Lastname"
              value={formData.lastName}
              onChange={handleChange}
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            />
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2"
          />
          <button
            type="submit"
            className="w-full text-white"
            style={{
              backgroundColor: "#898f63",
              padding: "0.5rem",
              borderRadius: "0.5rem",
            }}
          >
            Register
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
