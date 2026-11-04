import React from 'react';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint, getChartColor, formatNumber } from '../chartUtils';

interface ScatterChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  showGrid?: boolean;
}

export const ScatterChart: React.FC<ScatterChartProps> = ({
  data,
  title,
  subtitle,
  width,
  height,
  showGrid = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
            </svg>
          </div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-1">{data.category}</p>
          <p className="text-sm text-blue-400">
            X: {formatNumber(data.x || data.value)}
          </p>
          <p className="text-sm text-green-400">
            Y: {formatNumber(data.y || data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Transform data for scatter chart
  const scatterData = data.map((item, index) => ({
    x: typeof item.category === 'number' ? item.category : index,
    y: item.value,
    ...item
  }));

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
        <RechartsScatterChart
          data={scatterData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
            />
          )}
          <XAxis 
            type="number"
            dataKey="x"
            tickFormatter={formatNumber}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={{ stroke: '#374151' }}
            domain={['dataMin', 'dataMax']}
            allowDataOverflow={false}
          />
          <YAxis 
            type="number"
            dataKey="y"
            tickFormatter={formatNumber}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={{ stroke: '#374151' }}
            domain={['dataMin', 'dataMax']}
            allowDataOverflow={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter 
            dataKey="y" 
            fill="#3b82f6"
          />
        </RechartsScatterChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};