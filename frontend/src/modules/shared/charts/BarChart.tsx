import React from 'react';
import {
	BarChart as RechartsBarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Cell,
	ReferenceLine
} from 'recharts';
import { ChartDataPoint, getChartColor, formatNumber, truncateCategory, shouldUseHorizontalBars } from '../chartUtils';
import { getThemeColor, getColorScheme } from '../chartThemes';

interface BarChartProps {
	data: ChartDataPoint[];
	title?: string;
	subtitle?: string;
	width?: number;
	height?: number;
	horizontal?: boolean;
	showLegend?: boolean;
	showGrid?: boolean;
	stacked?: boolean;
	showValues?: boolean;
	colorScheme?: 'default' | 'gradient' | 'categorical' | 'performance';
	showAverage?: boolean;
	sortBy?: 'none' | 'ascending' | 'descending' | 'alphabetical';
}

export const BarChart: React.FC<BarChartProps> = ({
	data,
	title,
	subtitle,
	width,
	height,
	horizontal = false,
	showLegend = true,
	showGrid = true,
	stacked = false,
	showValues = false,
	colorScheme = 'default',
	showAverage = false,
	sortBy = 'none'
}) => {
	// Debug logging
	console.log('BarChart received data:', data?.length, 'points', data?.slice(0, 2));
	console.log('BarChart props:', { title, subtitle, horizontal, showLegend, showGrid, showValues, colorScheme, showAverage, sortBy });

	if (!data || data.length === 0) {
		console.log('BarChart: No data provided');
		return (
			<div className="flex items-center justify-center h-full text-gray-400">
				<div className="text-center">
					<div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
						<svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
					</div>
					<p className="text-sm">No data available for bar chart</p>
					<p className="text-xs text-gray-500 mt-1">Expected format: [{`{category: string, value: number}`}]</p>
				</div>
			</div>
		);
	}

	// Validate data structure
	const validData = data.filter(item => 
		item && 
		typeof item === 'object' && 
		'category' in item && 
		'value' in item && 
		typeof item.value === 'number' && 
		!isNaN(item.value)
	);

	if (validData.length === 0) {
		console.log('BarChart: No valid data points found');
		return (
			<div className="flex items-center justify-center h-full text-gray-400">
				<div className="text-center">
					<div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
						<svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<p className="text-sm">Invalid data format</p>
					<p className="text-xs text-gray-500 mt-1">Data must have 'category' and 'value' properties</p>
				</div>
			</div>
		);
	}

	// Sort data if requested
	let sortedData = [...data];
	switch (sortBy) {
		case 'ascending':
			sortedData.sort((a, b) => a.value - b.value);
			break;
		case 'descending':
			sortedData.sort((a, b) => b.value - a.value);
			break;
		case 'alphabetical':
			sortedData.sort((a, b) => a.category.localeCompare(b.category));
			break;
		default:
			break;
	}

	// Auto-determine horizontal layout for many categories
	const useHorizontal = horizontal || shouldUseHorizontalBars(sortedData.map(d => d.category));

	// Calculate average for reference line
	const average = sortedData.reduce((sum, item) => sum + item.value, 0) / sortedData.length;

	// Color schemes
	const getBarColor = (value: number, index: number) => {
		switch (colorScheme) {
			case 'gradient':
				const intensity = value / Math.max(...sortedData.map(d => d.value));
				return `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
			case 'performance':
				if (value >= average * 1.2) return '#10b981'; // Green for high performance
				if (value <= average * 0.8) return '#ef4444'; // Red for low performance
				return '#f59e0b'; // Yellow for average
			case 'categorical':
				return getChartColor(index);
			default:
				return getChartColor(index);
		}
	};

	// Custom tooltip with enhanced information
	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			const value = payload[0].value;
			const percentage = ((value / sortedData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1);
			const rank = sortedData.sort((a, b) => b.value - a.value).findIndex(item => item.category === label) + 1;
			
			return (
				<div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
					<p className="text-white font-medium mb-2">{label}</p>
					<div className="space-y-1">
						<p className="text-sm text-blue-400">
							Value: {formatNumber(value)}
						</p>
						<p className="text-sm text-green-400">
							Share: {percentage}%
						</p>
						<p className="text-sm text-yellow-400">
							Rank: #{rank} of {sortedData.length}
						</p>
						{showAverage && (
							<p className="text-sm text-purple-400">
								vs Avg: {value > average ? '+' : ''}{formatNumber(value - average)}
							</p>
						)}
					</div>
				</div>
			);
		}
		return null;
	};

	// Custom label for showing values on bars
	const CustomLabel = ({ x, y, width, height, value }: any) => {
		if (!showValues) return null;
		
		const labelX = useHorizontal ? x + width + 5 : x + width / 2;
		const labelY = useHorizontal ? y + height / 2 : y - 5;
		
		return (
			<text
				x={labelX}
				y={labelY}
				fill="#9ca3af"
				textAnchor={useHorizontal ? "start" : "middle"}
				fontSize={10}
				fontWeight="bold"
			>
				{formatNumber(value)}
			</text>
		);
	};

	const chartData = sortedData.map((item, index) => ({
		...item,
		fill: getBarColor(item.value, index)
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
					{useHorizontal ? (
						<RechartsBarChart
							data={chartData}
							layout="horizontal"
							margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
						>
							{showGrid && (
								<CartesianGrid 
									strokeDasharray="3 3" 
									stroke="#374151" 
									opacity={0.3}
									horizontal={false}
								/>
							)}
							<XAxis 
								type="number"
								tickFormatter={formatNumber}
								tick={{ fill: '#9ca3af', fontSize: 12 }}
								axisLine={{ stroke: '#374151' }}
								tickLine={{ stroke: '#374151' }}
								domain={['dataMin', 'dataMax']}
								allowDataOverflow={false}
							/>
							<YAxis 
								type="category" 
								dataKey="category"
								tick={{ fill: '#9ca3af', fontSize: 10 }}
								axisLine={{ stroke: '#374151' }}
								tickLine={{ stroke: '#374151' }}
								width={80}
							/>
							<Tooltip content={<CustomTooltip />} />
							{showAverage && (
								<ReferenceLine x={average} stroke="#8b5cf6" strokeDasharray="5 5" />
							)}
							<Bar 
								dataKey="value" 
								maxBarSize={20}
								radius={[0, 4, 4, 0]}
								label={showValues ? <CustomLabel /> : undefined}
							>
								{chartData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.fill} />
								))}
							</Bar>
						</RechartsBarChart>
					) : (
						<RechartsBarChart
							data={chartData}
							margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
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
								height={80}
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
							{showAverage && (
								<ReferenceLine y={average} stroke="#8b5cf6" strokeDasharray="5 5" />
							)}
							<Bar 
								dataKey="value" 
								maxBarSize={40}
								radius={[4, 4, 0, 0]}
								label={showValues ? <CustomLabel /> : undefined}
							>
								{chartData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.fill} />
								))}
							</Bar>
						</RechartsBarChart>
					)}
				</ResponsiveContainer>
			</div>
		</div>
	);
};