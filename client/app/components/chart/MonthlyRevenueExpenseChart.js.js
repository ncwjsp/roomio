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
  { name: "Jan", Revenue: 40000, Expenses: 30000 },
  { name: "Feb", Revenue: 45000, Expenses: 25000 },
  { name: "Mar", Revenue: 30000, Expenses: 20000 },
  { name: "Apr", Revenue: 35000, Expenses: 40000 },
  { name: "May", Revenue: 50000, Expenses: 45000 },
  { name: "Jun", Revenue: 30000, Expenses: 25000 },
  { name: "Jul", Revenue: 45000, Expenses: 35000 },
  { name: "Aug", Revenue: 40000, Expenses: 30000 },
  { name: "Sep", Revenue: 35000, Expenses: 20000 },
  { name: "Oct", Revenue: 48000, Expenses: 42000 },
  { name: "Nov", Revenue: 43000, Expenses: 30000 },
  { name: "Dec", Revenue: 37000, Expenses: 35000 },
];

const MonthlyRevenueExpenseChart = () => {
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

export default MonthlyRevenueExpenseChart;
