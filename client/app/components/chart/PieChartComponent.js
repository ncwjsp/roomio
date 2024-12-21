"use client";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const PieChartComponent = ({ data, title }) => (
  <div className="p-4 bg-white rounded-[10px] shadow">
    <h3 className="text-lg font-bold mb-4">{title}</h3>
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
      <Legend />
    </PieChart>
  </div>
);

export default PieChartComponent;
