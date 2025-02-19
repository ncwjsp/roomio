import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BarChartComponent = ({ data, xKey, yKeys, title }) => {
  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "#333" }}
            tickLine={{ stroke: "#333" }}
            axisLine={{ stroke: "#333" }}
          />
          <YAxis
            tick={{ fill: "#333" }}
            tickLine={{ stroke: "#333" }}
            axisLine={{ stroke: "#333" }}
            tickFormatter={(value) => 
              value >= 1000 ? `${value / 1000}k` : value
            }
          />
          <Tooltip
            formatter={(value) => [`${value.toLocaleString()} THB`, null]}
            labelFormatter={(value) => `Period: ${value}`}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          {yKeys.map((yKey, index) => (
            <Bar
              key={index}
              dataKey={yKey.dataKey}
              name={yKey.name || yKey.dataKey}
              fill={yKey.dataKey === "revenue" ? "#588F46" : "#CE4C4C"}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;