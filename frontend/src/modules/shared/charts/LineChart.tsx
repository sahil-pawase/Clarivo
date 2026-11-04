import React from 'react';
import {
	LineChart as RechartsLineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer
} from 'recharts';
import { ChartDataPoint, getChartColor, formatNumber, truncateCategory } from '../chartUtils';

interface LineChartProps {
	data: ChartDataPoint[];
	title?: string;
	subtitle?: string;
	width?: number;
	height?: number;
	smooth?: boolean;
	showDots?: boolean;
	showLegend?: boolean;
	showGrid?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
	data,
	title,
	subtitle,
	width,
	height,
	smooth = true,
	showDots = true,
	showLegend = true,
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

	// Custom tooltip
	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
					<p className="text-white font-medium mb-1">{label}</p>
					{payload.map((entry: any, index: number) => (
						<p key={index} className="text-sm" style={{ color: entry.color }}>
							{entry.name}: {formatNumber(entry.value)}
						</p>
					))}
				</div>
			);
		}
		return null;
	};

	// Custom axis tick
	const CustomAxisTick = ({ x, y, payload, ...props }: any) => {
		const text = truncateCategory(payload.value);
		return (
			<g transform={`translate(${x},${y})`}>
				<text
					x={0}
					y={0}
					dy={16}
					textAnchor="middle"
					fill="#9ca3af"
					fontSize={12}
				>
					{text}
				</text>
			</g>
		);
	};

	const chartData = data.map((item, index) => ({
		...item,
		stroke: getChartColor(index)
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
					<RechartsLineChart
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
							tick={<CustomAxisTick />}
							axisLine={{ stroke: '#374151' }}
							tickLine={{ stroke: '#374151' }}
							height={60}
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
						<Line 
							type={smooth ? "monotone" : "linear"}
							dataKey="value" 
							stroke={getChartColor(0)}
							strokeWidth={2}
							dot={showDots ? { r: 4 } : false}
							activeDot={{ r: 6 }}
						/>
					</RechartsLineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

