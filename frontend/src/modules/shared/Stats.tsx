import React from 'react';

export interface StatsSummary {
	min: number;
	max: number;
	mean: number;
	median: number;
	stdev: number;
	count: number;
}

export function computeStats(values: number[]): StatsSummary | null {
	if (!values || values.length === 0) return null;
	
	const sorted = [...values].sort((a, b) => a - b);
	const count = sorted.length;
	const sum = sorted.reduce((a, b) => a + b, 0);
	const mean = sum / count;
	
	const median = count % 2 === 0 
		? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
		: sorted[Math.floor(count / 2)];
	
	const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
	const stdev = Math.sqrt(variance);
	
	return {
		min: sorted[0],
		max: sorted[count - 1],
		mean,
		median,
		stdev,
		count
	};
}

interface SparklineProps {
	values: number[];
	width?: number;
	height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ values, width = 100, height = 30 }) => {
	if (!values || values.length === 0) return null;
	
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min;
	
	if (range === 0) return <div className="w-full h-8 bg-gray-700 rounded"></div>;
	
	const points = values.map((value, index) => {
		const x = (index / (values.length - 1)) * width;
		const y = height - ((value - min) / range) * height;
		return `${x},${y}`;
	}).join(' ');
	
	return (
		<svg width={width} height={height} className="w-full">
			<polyline
				points={points}
				fill="none"
				stroke="#60a5fa"
				strokeWidth="1.5"
				className="opacity-80"
			/>
		</svg>
	);
};