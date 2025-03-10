"use client";

import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import OverviewTab from "@/app/components/dashboard/OverviewTab";
import IncomeSummaryTab from "@/app/components/dashboard/IncomeSummaryTab";

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
              animationDelay: `${-0.0833 * (12 - i)}s`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes spinner-fade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [userId, setUserId] = useState(null);

  // Add effect to get the current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          throw new Error("Failed to fetch user session");
        }

        const data = await response.json();

        if (data.user) {
          const id = data.user.id || data.user._id || data.userId;
          if (id) {
            console.log("Found user ID:", id);
            setUserId(id);
          } else {
            console.error("User object found but no ID property:", data.user);
          }
        } else {
          console.error("No user object in session data:", data);
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  const handleTabChange = (newTab) => {
    setTab(newTab);
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-4xl font-bold mb-6">Dashboard</h1>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center rounded-[10px] overflow-hidden">
            <button
              onClick={() => handleTabChange("Overview")}
              className={`px-6 py-2 ${
                tab === "Overview"
                  ? "bg-[#898F63] text-white"
                  : "bg-white text-black"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleTabChange("Income Summary")}
              className={`px-6 py-2 ${
                tab === "Income Summary"
                  ? "bg-[#898F63] text-white"
                  : "bg-white text-black"
              }`}
            >
              Income Summary
            </button>
          </div>
        </div>

        {tab === "Overview" && <OverviewTab userId={userId} />}
        {tab === "Income Summary" && <IncomeSummaryTab userId={userId} />}
      </div>
    </div>
  );
};

export default Dashboard;
