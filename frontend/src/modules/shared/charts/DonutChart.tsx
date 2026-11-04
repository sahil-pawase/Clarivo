import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { ChartDataPoint, getChartColor, formatNumber } from '../chartUtils';

interface DonutChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  subtitle,
  width,
  height,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-1">{data.payload.category}</p>
          <p className="text-sm" style={{ color: data.color }}>
            Value: {formatNumber(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full p-2">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      )}
      {subtitle && (
        <p className="text-sm text-gray-400 mb-2">{subtitle}</p>
      )}
      
      <div className="flex-1 w-full" style={{ height: title || subtitle ? 'calc(100% - 60px)' : '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getChartColor(index)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ paddingTop: 8 }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};