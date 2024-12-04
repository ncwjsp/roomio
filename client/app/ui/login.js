import Link from "next/link";
import React from "react";

const Login = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold">
          Room<span className="text-black">io</span>
        </h1>
        <h3 className="text-md font-semibold">Apartment Management System</h3>
        <p className="text-sm text-gray-600 mt-4">Please Login your account</p>
        <form className="mt-6">
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
            className="w-full text-white py-2 rounded-lg hover:bg-neutral-300 transition duration-300"
          >
            Log In
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          New member here?{" "}
          <Link href="#" className="hover:underline">
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
