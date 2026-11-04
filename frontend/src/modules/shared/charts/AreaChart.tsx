import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint, getChartColor, formatNumber } from '../chartUtils';

interface AreaChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  gradient?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  title,
  subtitle,
  width,
  height,
  stacked = false,
  showLegend = true,
  showGrid = true,
  gradient = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg backdrop-blur-sm">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300">
                {entry.name}: <span className="text-white font-medium">{formatNumber(entry.value)}</span>
              </span>
            </div>
          ))}
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
          <RechartsAreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <defs>
              {gradient && (
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getChartColor(0)} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={getChartColor(0)} stopOpacity={0.1}/>
                </linearGradient>
              )}
            </defs>
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
              domain={['dataMin', 'dataMax']}
              allowDataOverflow={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ paddingBottom: 8 }}
              />
            )}
            <Area 
              type="monotone"
              dataKey="value" 
              stroke={getChartColor(0)}
              strokeWidth={2}
              fill={gradient ? "url(#areaGradient)" : getChartColor(0)}
              fillOpacity={gradient ? 1 : 0.3}
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};