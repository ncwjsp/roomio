"use client";

import { useState, useEffect } from "react";
import PieChartComponent from "@/app/components/chart/PieChartComponent";
import { Box } from "@mui/material";

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

const OverviewTab = ({ userId }) => {
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [overviewStats, setOverviewStats] = useState([]);
  const [overduePaymentPieData, setOverduePaymentPieData] = useState([]);
  const [roomVacancyPieData, setRoomVacancyPieData] = useState([]);
  const [maintenancePieData, setMaintenancePieData] = useState([]);
  const [cleaningPieData, setCleaningPieData] = useState([]);
  const [dashboardError, setDashboardError] = useState(null);

  useEffect(() => {
    // Fetch real-time dashboard data
    const fetchDashboardData = async () => {
      if (!userId) {
        // Use mock data if we don't have a user ID
        setIsChartLoading(true);

        // Set mock data instead
        setOverviewStats([
          {
            title: "Total Properties",
            value: "12",
            icon: "fas fa-building",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
          },
          {
            title: "Occupied Rooms",
            value: "48/52",
            icon: "fas fa-door-open",
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
          },
          {
            title: "Maintenance Requests",
            value: "8",
            icon: "fas fa-tools",
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-600",
          },
          {
            title: "Overdue Payments",
            value: "5",
            icon: "fas fa-exclamation-circle",
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
          },
        ]);

        setOverduePaymentPieData([
          { name: "Paid", value: 82 },
          { name: "Overdue", value: 18 },
        ]);

        setRoomVacancyPieData([
          { name: "Occupied", value: 92 },
          { name: "Vacant", value: 8 },
        ]);

        setMaintenancePieData([
          { name: "Completed", value: 65 },
          { name: "In Progress", value: 25 },
          { name: "Pending", value: 10 },
        ]);

        setCleaningPieData([
          { name: "Available", value: 92 },
          { name: "Pending", value: 8 },
        ]);

        setIsChartLoading(false);
        return;
      }

      try {
        setIsChartLoading(true);
        setDashboardError(null);

        const response = await fetch(
          `/api/dashboard/overview?userId=${userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();

        // Update state with fetched data
        setOverviewStats(data.overviewStats);
        setOverduePaymentPieData(data.overduePaymentPieData);
        setRoomVacancyPieData(data.roomVacancyPieData);
        setMaintenancePieData(data.maintenancePieData);
        setCleaningPieData(data.cleaningPieData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardError(error.message);

        // Set mock data on error
        setOverviewStats([
          {
            title: "Total Properties",
            value: "12",
            icon: "fas fa-building",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
          },
          {
            title: "Occupied Rooms",
            value: "48/52",
            icon: "fas fa-door-open",
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
          },
          {
            title: "Maintenance Requests",
            value: "8",
            icon: "fas fa-tools",
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-600",
          },
          {
            title: "Overdue Payments",
            value: "5",
            icon: "fas fa-exclamation-circle",
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
          },
        ]);

        setOverduePaymentPieData([
          { name: "Paid", value: 82 },
          { name: "Overdue", value: 18 },
        ]);

        setRoomVacancyPieData([
          { name: "Occupied", value: 92 },
          { name: "Vacant", value: 8 },
        ]);

        setMaintenancePieData([
          { name: "Completed", value: 65 },
          { name: "In Progress", value: 25 },
          { name: "Pending", value: 10 },
        ]);

        setCleaningPieData([
          { name: "Available", value: 92 },
          { name: "Pending", value: 8 },
        ]);
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  return (
    <div>
      {isChartLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      ) : dashboardError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{dashboardError}</span>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {overviewStats.map((stat, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-[10px] shadow flex justify-between items-center"
              >
                <div>
                  <h3 className="text-sm text-gray-500">{stat.title}</h3>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-[10px] ${stat.iconBg}`}
                >
                  <i className={`${stat.icon} ${stat.iconColor} text-3xl`}></i>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <PieChartComponent data={overduePaymentPieData} title="Payments" />
            <PieChartComponent data={roomVacancyPieData} title="Room Vacancy" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <PieChartComponent
              data={maintenancePieData}
              title="Maintenance Requests"
            />
            <PieChartComponent
              data={cleaningPieData}
              title="Cleaning Schedule"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
