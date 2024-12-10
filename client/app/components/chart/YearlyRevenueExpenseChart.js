"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "2022", Revenue: 4000000, Expenses: 3000000 },
  { name: "2023", Revenue: 5000000, Expenses: 4000000 },
  { name: "2024", Revenue: 4500000, Expenses: 3800000 },
];

const YearlyRevenueExpenseChart = () => {
  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="Revenue" fill="#588F46" />
          <Bar dataKey="Expenses" fill="#CE4C4C" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YearlyRevenueExpenseChart;
