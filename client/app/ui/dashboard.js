"use client";

import { useState } from "react";
import MonthlyRevenueExpenseChart from "@/app/components/chart/MonthlyRevenueExpenseChart";
import YearlyRevenueExpenseChart from "@/app/components/chart/YearlyRevenueExpenseChart";

const Dashboard = () => {
  const [view, setView] = useState("Monthly"); // "Monthly" or "Yearly"
  const [tab, setTab] = useState("Overview"); // "Overview" or "Income Summary"

  const incomeSummaryCards = [
    {
      title: "Total Revenue",
      value: "1,000,000 THB",
      icon: "bi bi-wallet2",
      iconBg: "bg-[#E9F9F1]",
      iconColor: "text-[#4AD991] font-bold",
    },
    {
      title: "Total Expense",
      value: "901,000 THB",
      icon: "bi bi-receipt-cutoff",
      iconBg: "bg-[#FDEAEA]",
      iconColor: "text-[#F30505] font-bold",
    },
    {
      title: "Net Profit / Loss",
      value: "$89,000",
      note: "4.3% Down from last month",
      noteClass: "text-red-500 flex items-center",
      icon: "bi bi-graph-up",
      iconBg: "bg-[#E9F9F1]",
      iconColor: "text-[#4AD991] font-bold",
    },
    {
      title: "Shared Electricity Usage",
      value: "78,563 THB",
      icon: "bi bi-lightning-charge-fill",
      iconBg: "bg-[#FFF8E5]",
      iconColor: "text-[#FFCC00] font-bold",
    },
    {
      title: "Shared Water Usage",
      value: "10,000 THB",
      icon: "bi bi-droplet-half",
      iconBg: "bg-[#E5F3FF]",
      iconColor: "text-[#0775FF] font-bold",
    },
    {
      title: "Total Staff Salary",
      value: "300,000 THB",
      icon: "bi bi-people-fill",
      iconBg: "bg-[#E5E8FF]",
      iconColor: "text-[#8280FF] font-bold",
    },
    {
      title: "Other Expenses",
      value: "56,000 THB",
      icon: "bi bi-wallet2",
      iconBg: "bg-[#FDEAEA]",
      iconColor: "text-[#F30505] font-bold",
    },
  ];

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

  const overduePayments = [
    { room: "A301", name: "Somchai Narakjang", total: "5,000 THB" },
    { room: "A302", name: "Anong Wang", total: "4,500 THB" },
    { room: "B101", name: "John Smith", total: "6,000 THB" },
    { room: "B102", name: "Marie Kondo", total: "5,200 THB" },
  ];

  const recentActivities = [
    "Room A301 booked a cleaning service",
    "Room B102 paid monthly rent",
    "Room C303 requested a maintenance service",
    "Room E101 AC fixing completed",
    "Room C202 booked a cleaning service",
  ];

  const maintenanceTasks = [
    {
      category: "Cleaning",
      location: "A301",
      description: "Monthly room cleaning",
      status: "Not assigned",
      statusClass: "text-gray-500",
    },
    {
      category: "Maintenance",
      location: "B301",
      description: "Loud AC noise",
      status: "Not assigned",
      statusClass: "text-gray-500",
    },
    {
      category: "Maintenance",
      location: "Building A",
      description: "Broken door",
      status: "In progress",
      statusClass: "text-orange-500",
    },
    {
      category: "Cleaning",
      location: "C669",
      description: "Monthly room cleaning",
      status: "Completed",
      statusClass: "text-green-500",
    },
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>

        <div className="flex justify-between items-center mb-8">
          {tab === "Income Summary" && (
            <div className="flex items-center rounded-[10px] overflow-hidden">
              <button
                onClick={() => setView("Monthly")}
                className={`px-6 py-2 ${
                  view === "Monthly"
                    ? "bg-[#898F63] text-white"
                    : "bg-white text-black"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setView("Yearly")}
                className={`px-6 py-2 ${
                  view === "Yearly"
                    ? "bg-[#898F63] text-white"
                    : "bg-white text-black"
                }`}
              >
                Yearly
              </button>
            </div>
          )}

          <div>
            {view === "Yearly" ? (
              <select
                className="px-4 py-2 rounded-[10px] bg-white border border-gray-300"
                defaultValue="2024"
              >
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
              </select>
            ) : (
              <select
                className="px-4 py-2 rounded-[10px] bg-white border border-gray-300"
                defaultValue="January"
              >
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            )}
          </div>

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

        {tab === "Overview" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
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
                    <i className={`${stat.icon} ${stat.iconColor} text-2xl`}></i>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white rounded-[10px] shadow">
                <h3 className="text-lg font-bold mb-4">Overdue Payment</h3>
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-left">
                      <th>Room</th>
                      <th>Name</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overduePayments.map((payment, index) => (
                      <tr key={index}>
                        <td>{payment.room}</td>
                        <td>{payment.name}</td>
                        <td>{payment.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-white rounded-[10px] shadow">
                <h3 className="text-lg font-bold mb-4">Recent Activities</h3>
                <ul>
                  {recentActivities.map((activity, index) => (
                    <li key={index}>{activity}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 bg-white rounded-[10px] shadow">
              <h3 className="text-lg font-bold mb-4">Maintenance & Cleaning</h3>
              <table className="w-full table-auto">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceTasks.map((task, index) => (
                    <tr key={index}>
                      <td>{task.category}</td>
                      <td>{task.location}</td>
                      <td>{task.description}</td>
                      <td className={task.statusClass}>{task.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Income Summary" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
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
                    <i
                      className={`${card.icon} ${card.iconColor} text-3xl`}
                    ></i>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white rounded-[10px] shadow">
              <h3 className="text-lg font-bold mb-4">
                {view === "Yearly"
                  ? "Yearly Revenue - Expense"
                  : "Monthly Revenue - Expense"}
              </h3>
              {view === "Yearly" ? (
                <YearlyRevenueExpenseChart />
              ) : (
                <MonthlyRevenueExpenseChart />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
