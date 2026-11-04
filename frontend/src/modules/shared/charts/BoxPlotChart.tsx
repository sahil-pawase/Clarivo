import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ErrorBar
} from 'recharts';
import { ChartDataPoint, getChartColor, formatNumber } from '../chartUtils';

interface BoxPlotData extends ChartDataPoint {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers?: number[];
}

interface BoxPlotChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  showGrid?: boolean;
}

export const BoxPlotChart: React.FC<BoxPlotChartProps> = ({
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Convert data to box plot format
  const processDataForBoxPlot = (data: ChartDataPoint[]): BoxPlotData[] => {
    // Group data by category if multiple categories exist
    const grouped = data.reduce((acc, item) => {
      const key = item.category || 'Data';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item.value);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(grouped).map(([category, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;
      
      const q1Index = Math.floor(n * 0.25);
      const medianIndex = Math.floor(n * 0.5);
      const q3Index = Math.floor(n * 0.75);
      
      const q1 = sorted[q1Index];
      const median = sorted[medianIndex];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;
      
      // Calculate whiskers (1.5 * IQR rule)
      const lowerWhisker = q1 - 1.5 * iqr;
      const upperWhisker = q3 + 1.5 * iqr;
      
      const min = Math.max(sorted[0], lowerWhisker);
      const max = Math.min(sorted[n - 1], upperWhisker);
      
      // Find outliers
      const outliers = sorted.filter(v => v < lowerWhisker || v > upperWhisker);
      
      return {
        category,
        value: median, // Required by ChartDataPoint
        min,
        q1,
        median,
        q3,
        max,
        outliers
      };
    });
  };

  const boxPlotData = processDataForBoxPlot(data);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = boxPlotData.find(d => d.category === label);
      if (data) {
        return (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
            <p className="text-white font-medium mb-2">{label}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Max:</span>
                <span className="text-white">{formatNumber(data.max)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Q3:</span>
                <span className="text-white">{formatNumber(data.q3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Median:</span>
                <span className="text-yellow-400 font-medium">{formatNumber(data.median)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Q1:</span>
                <span className="text-white">{formatNumber(data.q1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Min:</span>
                <span className="text-white">{formatNumber(data.min)}</span>
              </div>
              {data.outliers && data.outliers.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Outliers:</span>
                  <span className="text-red-400">{data.outliers.length}</span>
                </div>
              )}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  // Create chart data for rendering
  const chartData = boxPlotData.map(item => ({
    category: item.category,
    value: item.median, // Use median as the main value for the bar
    min: item.min,
    q1: item.q1,
    median: item.median,
    q3: item.q3,
    max: item.max,
    outliers: item.outliers
  }));

  return (
    <div className="w-full h-full p-2">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      )}
      {subtitle && (
        <p className="text-sm text-gray-400 mb-2">{subtitle}</p>
      )}
      
      <div className="mb-2 text-xs text-gray-400">
        Box plot showing quartiles, median, and outliers
      </div>
      
      <div className="flex-1 w-full" style={{ height: title || subtitle ? 'calc(100% - 80px)' : 'calc(100% - 20px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                opacity={0.3}
              />
            )}
            <XAxis 
              dataKey="category"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tickFormatter={formatNumber}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Render box plot as bars with error bars */}
            <Bar 
              dataKey="median" 
              fill={getChartColor(0)}
              opacity={0.7}
              maxBarSize={40}
            >
              <ErrorBar 
                dataKey="q1" 
                width={4}
                stroke={getChartColor(0)}
                strokeWidth={2}
              />
              <ErrorBar 
                dataKey="q3" 
                width={4}
                stroke={getChartColor(0)}
                strokeWidth={2}
              />
            </Bar>
            
            {/* Add lines for min/max whiskers */}
            <Line 
              type="monotone"
              dataKey="min" 
              stroke={getChartColor(1)}
              strokeWidth={1}
              dot={{ r: 2 }}
              strokeDasharray="2 2"
            />
            <Line 
              type="monotone"
              dataKey="max" 
              stroke={getChartColor(1)}
              strokeWidth={1}
              dot={{ r: 2 }}
              strokeDasharray="2 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};