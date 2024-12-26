"use client";

import { useState } from "react";
import PieChartComponent from "@/app/components/chart/PieChartComponent";
import {
  staffOverviewPieData,
  staffSalaryPieData,
  overviewStaffCards,
} from "@/app/data/staffData";

const StaffPage = () => {
  const [tab, setTab] = useState("Overview");

  const renderOverview = () => (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {overviewStaffCards.map((stat, index) => (
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
          data={staffOverviewPieData}
          title="Staff Overview by Role"
        />
        <PieChartComponent
          data={staffSalaryPieData}
          title="Staff Salaries by Role"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EBECE1]">
      <div className="w-full max-w-6xl p-5">
        <h1 className="text-3xl font-semibold mb-4">Staff Overview</h1>

        {tab === "Overview" && renderOverview()}
        {tab === "Management" && (
          <p className="text-gray-500">Staff management coming soon...</p>
        )}
      </div>
    </div>
  );
};

export default StaffPage;
