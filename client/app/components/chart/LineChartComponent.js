"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const LineChartComponent = ({ data, title, xKey, yKeys }) => (
  <div className="p-4 bg-white rounded-[10px] shadow">
    <h3 className="text-lg font-bold mb-4">{title}</h3>
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
      {yKeys.map((key, index) => (
        <Line key={index} type="monotone" dataKey={key.dataKey} stroke={key.color} />
      ))}
    </LineChart>
  </div>
);

export default LineChartComponent;
