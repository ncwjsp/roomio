"use client";

import { useState, useEffect } from "react";
import BarChartComponent from "@/app/components/chart/BarChartComponent";
import { format } from "date-fns";

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

const IncomeSummaryTab = ({ userId }) => {
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [view, setView] = useState("Monthly");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MMM"));
  const [monthlyFinancialData, setMonthlyFinancialData] = useState([]);
  const [yearlyFinancialData, setYearlyFinancialData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    rentRevenue: 0,
    electricityUsage: 0,
    waterUsage: 0,
    staffSalary: 0,
  });
  const [financialError, setFinancialError] = useState(null);

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Updated summary cards with the new categories
  const incomeSummaryCards = [
    {
      title: "Total Revenue Rent",
      value: formatCurrency(summaryData.rentRevenue),
      icon: "fas fa-money-bill",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      type: "revenue",
    },
    {
      title: "Total Electricity Usage",
      value: formatCurrency(summaryData.electricityUsage),
      icon: "fas fa-bolt",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      type: "electricity",
    },
    {
      title: "Total Water Usage",
      value: formatCurrency(summaryData.waterUsage),
      icon: "fas fa-tint",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      type: "water",
    },
    {
      title: "Total Staff Salary",
      value: formatCurrency(summaryData.staffSalary),
      icon: "fas fa-user-tie",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      type: "salary",
    },
  ];

  const fetchFinancialData = async (currentView, year, month) => {
    if (!userId) return; // Don't fetch if we don't have a user ID

    try {
      setFinancialError(null);
      setIsChartLoading(true);

      // Build the API URL with query parameters
      let url = `/api/dashboard/financial?view=${currentView}&year=${year}`;
      if (currentView === "Monthly") {
        url += `&month=${month}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch financial data");
      }

      const data = await response.json();

      if (currentView === "Monthly") {
        // Update summary data for the cards
        setSummaryData(data.summary);
      } else {
        // For yearly view, set the monthly data for the chart
        setMonthlyFinancialData(data.monthlyData);

        // Also update the summary data with yearly totals
        setSummaryData(data.yearlyTotals);
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
      setFinancialError(error.message);
    } finally {
      setIsChartLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData(view, selectedYear, selectedMonth);
  }, [view, selectedYear, selectedMonth, userId]);

  const renderBarChart = () => {
    let chartData =
      view === "Monthly" ? monthlyFinancialData : yearlyFinancialData;

    if (isChartLoading) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      );
    }

    if (financialError) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{financialError}</span>
        </div>
      );
    }

    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Financial Breakdown</h2>
        <div className="bg-white p-4 rounded-[10px] shadow">
          <BarChartComponent
            data={chartData}
            xKey={view === "Monthly" ? "month" : "year"}
            yKeys={[
              { dataKey: "rent", color: "#588F46", name: "Rent Revenue" },
              { dataKey: "electricity", color: "#F6C23E", name: "Electricity" },
              { dataKey: "water", color: "#4E73DF", name: "Water" },
              { dataKey: "salary", color: "#8A63D2", name: "Staff Salary" },
            ]}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {isChartLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {incomeSummaryCards.map((card, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-[10px] shadow flex justify-between items-center"
              >
                <div>
                  <h3 className="text-sm text-gray-500">{card.title}</h3>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-[10px] ${card.iconBg}`}
                >
                  <i className={`${card.icon} ${card.iconColor} text-3xl`}></i>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex">
                <button
                  onClick={() => setView("Monthly")}
                  className={`px-4 py-2 ${
                    view === "Monthly"
                      ? "bg-[#898F63] text-white"
                      : "bg-white text-black"
                  } rounded-l-[10px]`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setView("Yearly")}
                  className={`px-4 py-2 ${
                    view === "Yearly"
                      ? "bg-[#898F63] text-white"
                      : "bg-white text-black"
                  } rounded-r-[10px]`}
                >
                  Yearly
                </button>
              </div>

              <div className="flex gap-4">
                {view === "Monthly" && (
                  <select
                    className="px-4 py-2 rounded-[10px] bg-white border border-gray-300"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {[
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ].map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  className="px-4 py-2 rounded-[10px] bg-white border border-gray-300"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>
          </div>

          {view === "Yearly" && renderBarChart()}
        </>
      )}
    </>
  );
};

export default IncomeSummaryTab;
