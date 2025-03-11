"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MMM"));
  const [monthlyFinancialData, setMonthlyFinancialData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    rentRevenue: 0,
    electricityUsage: 0,
    waterUsage: 0,
    staffSalary: 0,
  });
  const [financialError, setFinancialError] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Format currency values to Thai Baht
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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

  // Fetch financial data
  const fetchFinancialData = useCallback(async () => {
    if (!userId) return;

    try {
      setFinancialError(null);
      setIsChartLoading(true);

      const url = `/api/dashboard/financial?year=${selectedYear}&month=${selectedMonth}`;
      console.log(`Fetching data from: ${url}`);

      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch financial data");
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (data.summary) {
        console.log("Setting summary data:", data.summary);
        setSummaryData(data.summary);
      }

      if (data.monthlyData) {
        setMonthlyFinancialData(data.monthlyData);
      }

      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      setFinancialError(error.message);
      setIsInitialLoad(false);
    } finally {
      setIsChartLoading(false);
    }
  }, [userId, selectedYear, selectedMonth]);

  // Fetch available years and months
  useEffect(() => {
    const fetchAvailableData = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/dashboard/available-data`);
        if (!response.ok) {
          throw new Error("Failed to fetch available data periods");
        }

        const data = await response.json();
        if (data.years?.length > 0) {
          setAvailableYears(data.years);
          const mostRecentYear = data.years[data.years.length - 1];
          setSelectedYear(mostRecentYear);

          if (data.monthsByYear?.[mostRecentYear]) {
            setAvailableMonths(data.monthsByYear[mostRecentYear]);
            if (data.monthsByYear[mostRecentYear].length > 0) {
              setSelectedMonth(
                data.monthsByYear[mostRecentYear][
                  data.monthsByYear[mostRecentYear].length - 1
                ]
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching available data periods:", error);
        setAvailableYears([new Date().getFullYear().toString()]);
        setAvailableMonths([
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
        ]);
      }
    };

    fetchAvailableData();
  }, [userId]);

  // Update available months when year changes
  useEffect(() => {
    const updateAvailableMonths = async () => {
      if (!userId) return;

      try {
        const response = await fetch(
          `/api/dashboard/available-data?year=${selectedYear}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch available months");
        }

        const data = await response.json();
        if (data.months?.length > 0) {
          setAvailableMonths(data.months);
          if (!data.months.includes(selectedMonth)) {
            setSelectedMonth(data.months[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching available months:", error);
        setAvailableMonths([
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
        ]);
      }
    };

    updateAvailableMonths();
  }, [selectedYear, userId, selectedMonth]);

  // Fetch financial data when year or month changes
  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const renderBarChart = () => {
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
            data={monthlyFinancialData}
            xKey="day"
            yKeys={[
              { dataKey: "rent", color: "#E74C3C", name: "Rent Revenue" },
              { dataKey: "electricity", color: "#F1C40F", name: "Electricity" },
              { dataKey: "water", color: "#3498DB", name: "Water" },
              { dataKey: "salary", color: "#2ECC71", name: "Staff Salary" },
            ]}
            stackBars={false}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {isInitialLoad || isChartLoading ? (
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
                  <i className={`${card.icon} ${card.iconColor}`}></i>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-4">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-2 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#898F63]"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#898F63]"
                >
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {renderBarChart()}
          </div>
        </>
      )}
    </>
  );
};

export default IncomeSummaryTab;
