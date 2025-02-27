"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const PieChartComponent = ({ data, title }) => {
  // Check if data is valid and has at least one item with a non-zero value
  const hasValidData = data && 
                      Array.isArray(data) && 
                      data.length > 0 && 
                      data.some(item => item.value > 0);

  if (!hasValidData) {
    return (
      <div className="bg-white rounded-[10px] shadow p-4">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div className="flex justify-center items-center h-[300px]">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  // Define color palette for the chart
  const COLORS = data.map(item => item.color || "#4CAF50");

  // Custom label renderer for better visibility
  const renderCustomizedLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only show label if the segment is large enough (more than 5%)
    if (percent < 0.05) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#333333"
        fontWeight="bold"
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        style={{
          filter: 'drop-shadow(1px 1px 1px rgba(255, 255, 255, 0.7))'
        }}
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip formatter
  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
          <p className="font-bold">{payload[0].name}</p>
          <p className="text-gray-700">{`Value: ${payload[0].value}`}</p>
          <p className="text-gray-700">{`Percentage: ${(payload[0].payload.percent * 100).toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[10px] shadow p-4">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map(item => ({
                ...item,
                percent: item.value / data.reduce((sum, i) => sum + i.value, 0)
              }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "12px"
              }}
            />
            <Tooltip content={customTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PieChartComponent;
