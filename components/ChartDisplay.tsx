import React from 'react';
import { ChartData } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartDisplayProps {
  chartData: ChartData;
}

const ChartDisplayComponent: React.FC<ChartDisplayProps> = ({ chartData }) => {
  const { type, data, dataKey, categoryKey, xKey, yKey } = chartData;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        if (!categoryKey || !dataKey) return <div className="text-sm text-red-400">Bar chart requires a categoryKey and a dataKey.</div>;
        return (
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
            <XAxis dataKey={categoryKey} stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e1e',
                borderColor: '#4a4a4a',
                color: '#e2e8f0',
              }}
              cursor={{ fill: '#4a4a4a' }}
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar dataKey={dataKey} fill="#818cf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
         if (!categoryKey || !dataKey) return <div className="text-sm text-red-400">Line chart requires a categoryKey and a dataKey.</div>;
         return (
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
            <XAxis dataKey={categoryKey} stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e1e',
                borderColor: '#4a4a4a',
                color: '#e2e8f0',
              }}
               cursor={{ fill: '#4a4a4a' }}
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Line type="monotone" dataKey={dataKey} stroke="#818cf8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        );
      case 'area':
        if (!categoryKey || !dataKey) return <div className="text-sm text-red-400">Area chart requires a categoryKey and a dataKey.</div>;
        return (
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
            <XAxis dataKey={categoryKey} stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e1e',
                borderColor: '#4a4a4a',
                color: '#e2e8f0',
              }}
              cursor={{ fill: '#4a4a4a' }}
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Area type="monotone" dataKey={dataKey} stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
          </AreaChart>
        );
       case 'scatter':
        if (!xKey || !yKey) return <div className="text-sm text-red-400">Scatter chart requires an xKey and a yKey.</div>;
        return (
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
            <XAxis type="number" dataKey={xKey} name={xKey} stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis type="number" dataKey={yKey} name={yKey} stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e1e',
                borderColor: '#4a4a4a',
                color: '#e2e8f0',
              }}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Scatter name="Dataset" data={data} fill="#818cf8" />
          </ScatterChart>
        );
      case 'pie': {
        if (!categoryKey || !dataKey) return <div className="text-sm text-red-400">Pie chart requires a categoryKey and a dataKey.</div>;
        const COLORS = ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd', '#ddd6fe'];
        return (
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey={dataKey}
                    nameKey={categoryKey}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                        );
                    }}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1e1e1e',
                        borderColor: '#4a4a4a',
                        color: '#e2e8f0',
                    }}
                />
                <Legend wrapperStyle={{ fontSize: '14px' }} />
            </PieChart>
        );
      }
      default:
        return <div className="text-red-400">Unsupported chart type: {type}</div>;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

export const ChartDisplay = React.memo(ChartDisplayComponent);