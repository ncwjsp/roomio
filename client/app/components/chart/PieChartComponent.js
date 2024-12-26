"use client";

import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

const PieChartComponent = ({ data, title }) => {
  if (!data || !Array.isArray(data)) {
    return <p className="text-red-500">Invalid data format for pie chart.</p>;
  }

  // Define color palette for the chart
  const COLORS = ["#4CAF50", "#FFA726", "#29B6F6", "#FF5252", "#AB47BC"];

  return (
    <div className="bg-white rounded-[10px] shadow p-4">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <PieChart width={400} height={300}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          label
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
        <Tooltip />
      </PieChart>
    </div>
  );
};

export default PieChartComponent;
