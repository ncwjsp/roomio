"use client";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

const Register = () => {
  const router = useRouter();

  const handleRegister = (e) => {
    e.preventDefault();
    // Add your registration logic here (e.g., API call to create a new user)

    // After successful registration, navigate to the login page
    router.push("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold">
          Room<span className="text-black">io</span>
        </h1>
        <h3 className="text-md font-semibold">Apartment Management System</h3>
        <p className="text-sm text-gray-600 mt-4">Create your account</p>
        <form className="mt-6" onSubmit={handleRegister}>
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              placeholder="Firstname"
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            />
            <input
              type="text"
              placeholder="Lastname"
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            />
          </div>
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2"
          />
          <button
            type="submit"
            className="w-full text-white"
            style={{ backgroundColor: "#898f63", padding: "0.5rem", borderRadius: "0.5rem" }}
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
