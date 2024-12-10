"use client";

import { useState } from "react";

const Dashboard = () => {
  const [view, setView] = useState("Monthly"); // "Monthly" or "Yearly"
  const [tab, setTab] = useState("Overview"); // "Overview" or "Income Summary"

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        {/* Header */}
        <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>

        {/* Filters */}
        <div className="flex justify-between items-center mb-8">
          {/* Conditional Monthly/Yearly Buttons */}
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

          {/* Year/Month Filter */}
          <div>
            {view === "Yearly" ? (
              <select
                className="px-4 py-2 rounded-[10px] bg-white border border-gray-300"
                defaultValue="2024"
              >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
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

          {/* Grouped Overview/Income Summary Buttons */}
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

        {/* Conditional Content Based on Selected Tab */}
        {tab === "Overview" && (
          <div>
            {/* Overview Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { title: "Total Tenants", value: "1,026", icon: "bi-people" },
                { title: "Total Rooms", value: "1,100", icon: "bi-door-closed" },
                { title: "Total Staffs", value: "32", icon: "bi-person" },
                { title: "Total Parcels", value: "2,040", icon: "bi-box" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-[10px] shadow flex flex-col items-center"
                >
                  <i
                    className={`bi ${stat.icon} text-4xl text-gray-500 mb-2`}
                  ></i>
                  <h3 className="text-sm text-gray-500">{stat.title}</h3>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Overdue Payment and Recent Activities */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Overdue Payment */}
              <div className="p-4 bg-white rounded-[10px] shadow">
                <h3 className="text-lg font-bold mb-4">Overdue Payment</h3>
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2">Room No.</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array(7)
                      .fill()
                      .map((_, index) => (
                        <tr key={index} className="text-sm">
                          <td>A301</td>
                          <td>Somchai Narakjang</td>
                          <td>5,000 THB</td>
                          <td>
                            <button className="px-4 py-1 text-white bg-[#898F63] rounded-[10px]">
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Recent Activities */}
              <div className="p-4 bg-white rounded-[10px] shadow">
                <h3 className="text-lg font-bold mb-4">Recent Activities</h3>
                <ul className="list-disc list-inside text-sm text-gray-500">
                  {Array(10)
                    .fill()
                    .map((_, index) => (
                      <li key={index}>
                        Room A301 booked a cleaning service
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* Maintenance & Cleaning */}
            <div className="p-4 bg-white rounded-[10px] shadow mb-6">
              <h3 className="text-lg font-bold mb-4">Maintenance & Cleaning</h3>
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Location</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
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
                  ].map((task, index) => (
                    <tr key={index} className="text-sm">
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

        {/* Income Summary Content */}
        {tab === "Income Summary" && (
          <div>
            <div>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { title: "Total Revenue", value: "1,000,000 THB" },
                  { title: "Total Expense", value: "901,000 THB" },
                  {
                    title: "Net Profit / Loss",
                    value: "$89,000",
                    note: "4.3% Down from last month",
                    noteClass: "text-red-500 flex items-center",
                  },
                  { title: "Shared Electricity Usage", value: "78,563 THB" },
                  { title: "Shared Water Usage", value: "10,000 THB" },
                  { title: "Total Staff Salary", value: "300,000 THB" },
                  { title: "Other Expenses", value: "56,000 THB" },
                ].map((card, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-[10px] shadow min-w-[200px] min-h-[150px] flex flex-col justify-between"
                  >
                    <h3 className="text-sm text-gray-500">{card.title}</h3>
                    <p className="text-2xl font-bold">{card.value}</p>
                    {card.note && (
                      <p className={`${card.noteClass} text-sm`}>
                        <i className="bi bi-graph-down-arrow mr-1"></i>
                        {card.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="p-4 bg-white rounded-[10px] shadow">
                <h3 className="text-lg font-bold mb-4">
                  {view === "Yearly"
                    ? "Yearly Revenue - Expense"
                    : "Monthly Revenue - Expense"}
                </h3>
                <div className="h-64">
                  {/* Replace with actual chart */}
                  <p className="text-center text-gray-500">
                    [Chart Placeholder for {view}]
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
