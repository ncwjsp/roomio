"use client";

import { useState, useEffect } from "react";
import PieChartComponent from "@/app/components/chart/PieChartComponent";
import LineChartComponent from "@/app/components/chart/LineChartComponent";
import BarChartComponent from "@/app/components/chart/BarChartComponent";
import {
  monthlyRevenueExpenseData,
  yearlyRevenueExpenseData,
  electricityUsageData,
  waterUsageData,
  staffSalaryData,
  otherExpenseData,
  overviewStats,
  overduePaymentPieData,
  roomVacancyPieData,
  maintenancePieData,
  incomeSummaryCards,
} from "@/app/data/chartData";
import { Box} from "@mui/material";

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
              animationDelay: `${-0.0833 * (12 - i)}s`
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes spinner-fade {
          0% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
};

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [selectedCard, setSelectedCard] = useState(null);
  const [view, setView] = useState("Monthly");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMonth, setSelectedMonth] = useState("Jan");

  useEffect(() => {
    // Simulate initial data loading
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleTabChange = async (newTab) => {
    setIsChartLoading(true);
    setTab(newTab);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsChartLoading(false);
  };

  const renderOverview = () => (
    <div>
      {isChartLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
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
            <PieChartComponent
              data={overduePaymentPieData}
              title="Overdue Payments"
            />
            <PieChartComponent data={roomVacancyPieData} title="Room Vacancy" />
          </div>

          <div className="w-full mb-6">
            <div className="bg-white rounded-[10px] shadow p-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4">Maintenance & Cleaning</h3>
              <div className="w-full max-w-md">
                <PieChartComponent
                  data={maintenancePieData}
                  title=""
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBarChart = () => {
    let chartData = view === "Monthly" ? monthlyRevenueExpenseData :
      yearlyRevenueExpenseData.find(data => data.year === selectedYear)
        ? [yearlyRevenueExpenseData.find(data => data.year === selectedYear)]
        : [];

    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Revenue vs Expense Comparison
        </h2>
        <div className="bg-white p-4 rounded-[10px] shadow">
          <BarChartComponent
            data={chartData}
            xKey="month"
            yKeys={[
              { dataKey: "revenue", color: "#588F46", name: "Revenue" },
              { dataKey: "expense", color: "#CE4C4C", name: "Expense" },
            ]}
          />
        </div>
      </div>
    );
  };

  const renderIncomeSummary = () => (
    <>
      {isChartLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner  />
        </div>
      ) : selectedCard === null ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {incomeSummaryCards.map((card, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-[10px] shadow flex justify-between items-center cursor-pointer"
                onClick={() => setSelectedCard(card.type)}
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
                    {monthlyRevenueExpenseData.map((item) => (
                      <option key={item.month} value={item.month}>
                        {item.month}
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

          {renderBarChart()}
        </>
      ) : (
        <div>
          <div className="flex items-center mb-4">
            <button
              onClick={() => setView("Monthly")}
              className={`px-4 py-2 ${
                view === "Monthly"
                  ? "bg-[#898F63] text-white"
                  : "bg-white text-black"
              } rounded-[10px] mr-4`}
            >
              Monthly
            </button>
            <button
              onClick={() => setView("Yearly")}
              className={`px-4 py-2 ${
                view === "Yearly"
                  ? "bg-[#898F63] text-white"
                  : "bg-white text-black"
              } rounded-[10px]`}
            >
              Yearly
            </button>
          </div>

          {view === "Yearly" && (
            <select
              className="px-4 py-2 rounded-[10px] bg-white border border-gray-300 mb-4"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
            </select>
          )}

          {selectedCard === "revenue" && (
            <LineChartComponent
              data={view === "Monthly" ? monthlyRevenueExpenseData : 
                yearlyRevenueExpenseData.filter(data => data.year === selectedYear)}
              title="Revenue Graph"
              xKey={view === "Monthly" ? "month" : "year"}
              yKeys={[{ dataKey: "revenue", color: "#4AD991" }]}
            />
          )}
          {selectedCard === "expense" && (
            <LineChartComponent
              data={view === "Monthly" ? monthlyRevenueExpenseData :
                yearlyRevenueExpenseData.filter(data => data.year === selectedYear)}
              title="Expense Graph"
              xKey={view === "Monthly" ? "month" : "year"}
              yKeys={[{ dataKey: "expense", color: "#F30505" }]}
            />
          )}
          {selectedCard === "net-profit" && (
            <LineChartComponent
              data={view === "Monthly" ? monthlyRevenueExpenseData :
                yearlyRevenueExpenseData.filter(data => data.year === selectedYear)}
              title="Net Profit/Loss Graph"
              xKey={view === "Monthly" ? "month" : "year"}
              yKeys={[
                { dataKey: "revenue", color: "#4AD991" },
                { dataKey: "expense", color: "#F30505" },
              ]}
            />
          )}
          {selectedCard === "electricity" && (
            <PieChartComponent
              data={electricityUsageData}
              title="Electricity Usage"
            />
          )}
          {selectedCard === "water" && (
            <PieChartComponent data={waterUsageData} title="Water Usage" />
          )}
          {selectedCard === "staff-salary" && (
            <PieChartComponent data={staffSalaryData} title="Staff Salaries" />
          )}
          {selectedCard === "other-expenses" && (
            <PieChartComponent data={otherExpenseData} title="Other Expenses" />
          )}
          <button
            className="px-4 py-2 bg-[#898F63] text-white rounded-[10px] mt-4"
            onClick={() => setSelectedCard(null)}
          >
            Back
          </button>
        </div>
      )}
    </>
  );


  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
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

        {tab === "Overview" && renderOverview()}
        {tab === "Income Summary" && renderIncomeSummary()}
      </div>
    </div>
  );
};

export default Dashboard;