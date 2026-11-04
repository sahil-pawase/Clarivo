import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint, getChartColor, formatNumber } from '../chartUtils';

interface HistogramChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  bins?: number;
  showGrid?: boolean;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  data,
  title,
  subtitle,
  bins = 10,
  showGrid = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Create histogram bins
  const values = data.map(d => d.value).filter(v => typeof v === 'number');
  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-sm">No numeric data available for histogram</p>
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / bins;

  const histogramData = Array.from({ length: bins }, (_, i) => {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const binCenter = (binStart + binEnd) / 2;

    const count = values.filter(v => {
      if (i === bins - 1) {
        return v >= binStart && v <= binEnd; // Include max value in last bin
      }
      return v >= binStart && v < binEnd;
    }).length;

    return {
      category: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      value: count,
      binCenter,
      binStart,
      binEnd
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-1">Range: {data.category}</p>
          <p className="text-sm text-blue-400">
            Frequency: {data.value}
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

      <div className="mb-2 text-xs text-gray-400">
        Distribution of {values.length} values • {bins} bins
      </div>

      <div className="flex-1 w-full" style={{ height: title || subtitle ? 'calc(100% - 80px)' : 'calc(100% - 20px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={histogramData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
                vertical={false}
              />
            )}
            <XAxis
              dataKey="category"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tickFormatter={formatNumber}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill="#3b82f6"
              stroke="#1e40af"
              strokeWidth={1}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};