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

// Custom tooltip to format values as Thai Baht
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
        <p className="font-semibold">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

// Custom Y-axis tick formatter to display Thai Baht
const formatYAxis = (value) => {
  if (value === 0) return "฿0";
  if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `฿${(value / 1000).toFixed(0)}K`;
  return `฿${value}`;
};

const BarChartComponent = ({ data, xKey, yKeys, stackBars = false }) => {
  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
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
            tickFormatter={formatYAxis}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          {yKeys.map((yKey, index) => (
            <Bar
              key={index}
              dataKey={yKey.dataKey}
              name={yKey.name}
              fill={yKey.color}
              stackId={stackBars ? "stack" : yKey.dataKey}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;
