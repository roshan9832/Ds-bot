
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
} from 'recharts';

interface ChartDisplayProps {
  chartData: ChartData;
}

const ChartDisplayComponent: React.FC<ChartDisplayProps> = ({ chartData }) => {
  const { type, data, dataKey, categoryKey } = chartData;

  const renderChart = () => {
    switch (type) {
      case 'bar':
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
