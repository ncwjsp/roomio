"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Data for Monthly and Yearly Revenue and Expense
const monthlyRevenueExpenseData = [
  { month: "Jan", revenue: 45000, expense: 30000 },
  { month: "Feb", revenue: 50000, expense: 35000 },
  { month: "Mar", revenue: 47000, expense: 40000 },
  { month: "Apr", revenue: 55000, expense: 42000 },
  { month: "May", revenue: 60000, expense: 45000 },
  { month: "Jun", revenue: 52000, expense: 48000 },
  { month: "Jul", revenue: 58000, expense: 47000 },
  { month: "Aug", revenue: 61000, expense: 49000 },
  { month: "Sep", revenue: 62000, expense: 50000 },
  { month: "Oct", revenue: 63000, expense: 51000 },
  { month: "Nov", revenue: 64000, expense: 52000 },
  { month: "Dec", revenue: 65000, expense: 53000 },
];

const yearlyRevenueExpenseData = [
  { year: "2022", revenue: 500000, expense: 420000 },
  { year: "2023", revenue: 540000, expense: 450000 },
  { year: "2024", revenue: 580000, expense: 500000 },
];

// Other Data for Pie Charts
const electricityUsageData = [
  { name: "Personal Area", value: 70, color: "#FFCC00" },
  { name: "Common Area", value: 30, color: "#4AD991" },
];

const waterUsageData = [
  { name: "Personal Area", value: 60, color: "#FFCC00" },
  { name: "Common Area", value: 40, color: "#4AD991" },
];

const staffSalaryData = [
  { name: "Security", value: 120000, color: "#4AD991" },
  { name: "Housekeeper", value: 100000, color: "#FFA600" },
  { name: "Electrician", value: 50000, color: "#009231" },
  { name: "Plumber", value: 30000, color: "#B53405" },
];

const otherExpenseData = [
  { name: "Repairs", value: 25000, color: "#4AD991" },
  { name: "Office Supplies", value: 10000, color: "#FFA600" },
  { name: "Miscellaneous", value: 15000, color: "#B53405" },
];

// Data for Overview
const overviewStats = [
  {
    title: "Total Tenants",
    value: "1,026",
    icon: "bi bi-people",
    iconBg: "bg-[#E5E8FF]",
    iconColor: "text-[#8280FF] font-bold",
  },
  {
    title: "Total Rooms",
    value: "1,100",
    icon: "bi bi-door-closed",
    iconBg: "bg-[#FFF8E5]",
    iconColor: "text-[#FFA600] font-bold",
  },
  {
    title: "Total Staffs",
    value: "32",
    icon: "bi bi-person-fill",
    iconBg: "bg-[#E9F9F1]",
    iconColor: "text-[#009231] font-bold",
  },
  {
    title: "Total Parcels",
    value: "2,040",
    icon: "bi bi-box-fill",
    iconBg: "bg-[#FDEAEA]",
    iconColor: "text-[#B53405] font-bold",
  },
];

const overduePaymentPieData = [
  { name: "Paid", value: 70, color: "#009231" },
  { name: "Overdue", value: 20, color: "#B53405" },
  { name: "Waiting", value: 10, color: "#FFCC00" },
];

const roomVacancyPieData = [
  { name: "Available Rooms", value: 700, color: "#009231" },
  { name: "Occupied Rooms", value: 400, color: "#B53405" },
];

const maintenancePieData = [
  { name: "Successful", value: 70, color: "#009231" },
  { name: "Pending", value: 20, color: "#B53405" },
  { name: "In Progress", value: 10, color: "#FFCC00" },
];

// Income Summary Cards
const incomeSummaryCards = [
  {
    title: "Total Revenue",
    value: "1,000,000 THB",
    icon: "bi bi-wallet2",
    iconBg: "bg-[#E9F9F1]",
    iconColor: "text-[#4AD991] font-bold",
    type: "revenue",
  },
  {
    title: "Total Expense",
    value: "901,000 THB",
    icon: "bi bi-receipt-cutoff",
    iconBg: "bg-[#FDEAEA]",
    iconColor: "text-[#F30505] font-bold",
    type: "expense",
  },
  {
    title: "Net Profit / Loss",
    value: "$89,000",
    icon: "bi bi-graph-up",
    iconBg: "bg-[#E9F9F1]",
    iconColor: "text-[#4AD991] font-bold",
    type: "net-profit",
  },
  {
    title: "Shared Electricity Usage",
    value: "78,563 THB",
    icon: "bi bi-lightning-charge-fill",
    iconBg: "bg-[#FFF8E5]",
    iconColor: "text-[#FFCC00] font-bold",
    type: "electricity",
  },
  {
    title: "Shared Water Usage",
    value: "10,000 THB",
    icon: "bi bi-droplet-half",
    iconBg: "bg-[#E5F3FF]",
    iconColor: "text-[#0775FF] font-bold",
    type: "water",
  },
  {
    title: "Total Staff Salary",
    value: "300,000 THB",
    icon: "bi bi-people-fill",
    iconBg: "bg-[#E5E8FF]",
    iconColor: "text-[#8280FF] font-bold",
    type: "staff-salary",
  },
  {
    title: "Other Expenses",
    value: "56,000 THB",
    icon: "bi bi-wallet2",
    iconBg: "bg-[#FDEAEA]",
    iconColor: "text-[#F30505] font-bold",
    type: "other-expenses",
  },
];

const Dashboard = () => {
  const [tab, setTab] = useState("Overview");
  const [selectedCard, setSelectedCard] = useState(null);
  const [view, setView] = useState("Monthly"); // Toggle between Monthly and Yearly
  const [selectedYear, setSelectedYear] = useState("2024");
  const [isMounted, setIsMounted] = useState(false); // State to track component mount

  // UseEffect to ensure that hydration occurs correctly by setting `isMounted` to true after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // This prevents the component from rendering until after the first render
  }

  const renderPieChart = (data, title) => (
    <div className="p-4 bg-white rounded-[10px] shadow flex items-center">
      <PieChart width={300} height={300}>
        <Pie
          data={data}
          dataKey="value"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ value }) => `${value}`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
      <div className="ml-4">
        <h3 className="text-lg font-bold">{title}</h3>
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <div
              style={{ backgroundColor: entry.color }}
              className="w-4 h-4 rounded-full"
            ></div>
            <span className="text-sm">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLineChart = (data, title, xKey, yKeys) => (
    <div className="p-4 bg-white rounded-[10px] shadow">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {yKeys.map((key, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={key.dataKey}
            stroke={key.color}
          />
        ))}
      </LineChart>
    </div>
  );

  const renderOverview = () => (
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
        {renderPieChart(overduePaymentPieData, "Overdue Payments")}
        {renderPieChart(roomVacancyPieData, "Room Vacancy")}
      </div>

      <div>{renderPieChart(maintenancePieData, "Maintenance & Cleaning")}</div>
    </div>
  );

  const renderIncomeSummary = () => (
    <>
      {selectedCard === null ? (
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

          {selectedCard === "revenue" &&
            renderLineChart(
              view === "Monthly"
                ? monthlyRevenueExpenseData
                : yearlyRevenueExpenseData.filter(
                    (data) => data.year === selectedYear
                  ),
              "Revenue Graph",
              view === "Monthly" ? "month" : "year",
              [{ dataKey: "revenue", color: "#4AD991" }]
            )}
          {selectedCard === "expense" &&
            renderLineChart(
              view === "Monthly"
                ? monthlyRevenueExpenseData
                : yearlyRevenueExpenseData.filter(
                    (data) => data.year === selectedYear
                  ),
              "Expense Graph",
              view === "Monthly" ? "month" : "year",
              [{ dataKey: "expense", color: "#F30505" }]
            )}
          {selectedCard === "electricity" &&
            renderPieChart(electricityUsageData, "Electricity Usage")}
          {selectedCard === "water" &&
            renderPieChart(waterUsageData, "Water Usage")}
          {selectedCard === "staff-salary" &&
            renderPieChart(staffSalaryData, "Staff Salaries")}
          {selectedCard === "other-expenses" &&
            renderPieChart(otherExpenseData, "Other Expenses")}
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

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center rounded-[10px] overflow-hidden">
            <button
              onClick={() => setTab("Overview")}
              className={`px-6 py-2 ${
                tab === "Overview"
                  ? "bg-[#898F63] text-white"
                  : "bg-white text-black"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab("Income Summary")}
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
