"use client";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

const Login = () => {
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    // Add your login logic here (e.g., API call to authenticate user)

    // After successful login, navigate to the dashboard page
    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold">
          Room<span className="text-black">io</span>
        </h1>
        <h3 className="text-md font-semibold">Apartment Management System</h3>
        <p className="text-sm text-gray-600 mt-4">Please Login your account</p>
        <form className="mt-6" onSubmit={handleLogin}>
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
          <div className="flex justify-between items-center mb-4">
            <label className="flex items-center text-sm text-gray-600">
              <input type="checkbox" className="mr-2" />
              Remember me
            </label>
            <a href="#" className="text-sm hover:underline">
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            className="w-full text-white"
            style={{ backgroundColor: "#898f63", padding: "0.5rem", borderRadius: "0.5rem" }}
          >
            Log In
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          New member here?{" "}
          <Link href="/register" className="hover:underline">
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
