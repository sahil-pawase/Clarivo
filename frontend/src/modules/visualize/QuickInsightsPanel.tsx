import React, { useMemo } from 'react';
import { DashboardChart } from './SmartVisualizationDashboard';
import { sanitizeChartData } from '../shared/chartUtils';

interface QuickInsightsPanelProps {
	data: any[];
	columns: string[];
	onCreateChart: (chartConfig: Partial<DashboardChart>) => void;
	recommendations?: any[]; // Backend recommendations
}

interface ColumnInsight {
	column: string;
	type: 'numeric' | 'categorical' | 'date';
	uniqueValues: number;
	nullValues: number;
	sampleValues: any[];
	recommendedCharts: Array<{
		type: 'bar' | 'line' | 'donut' | 'pie';
		xColumn: string;
		yColumn: string;
		title: string;
		reason: string;
	}>;
}

export const QuickInsightsPanel: React.FC<QuickInsightsPanelProps> = ({
	data,
	columns,
	onCreateChart,
	recommendations = []
}) => {
	// Analyze columns and generate insights
	const columnInsights = useMemo<ColumnInsight[]>(() => {
		if (!data || data.length === 0) return [];

		const realColumns = columns.filter(col => col !== 'index' && col !== 'count');
		
		return realColumns.map(column => {
			const values = data.map(row => row[column]).filter(val => val != null && val !== '');
			const uniqueValues = new Set(values).size;
			const nullValues = data.length - values.length;
			const sampleValues = Array.from(new Set(values)).slice(0, 5);

			// Determine column type more accurately
			const numericValues = values.filter(val => !isNaN(Number(val)) && isFinite(Number(val)));
			const isNumeric = numericValues.length / values.length > 0.7;
			
			// More strict date detection - avoid false positives from numeric values
			const isDate = values.some(val => {
				const str = String(val);
				// Only consider it a date if it contains typical date separators
				return (/[\-\/\.]/.test(str) || /\d{4}/.test(str)) && !isNaN(Date.parse(str)) && isNaN(Number(val));
			});
			
			const type: 'numeric' | 'categorical' | 'date' = isNumeric ? 'numeric' : isDate ? 'date' : 'categorical';

			// Generate chart recommendations
			const recommendedCharts: ColumnInsight['recommendedCharts'] = [];

			if (type === 'categorical') {
				// Categorical columns work well with count-based charts
				recommendedCharts.push(
					{
						type: 'bar',
						xColumn: column,
						yColumn: 'count',
						title: `${column} Distribution`,
						reason: 'Shows frequency of each category'
					},
					{
						type: 'donut',
						xColumn: column,
						yColumn: 'count',
						title: `${column} Breakdown`,
						reason: 'Visual proportion of categories'
					}
				);
			}

			if (type === 'numeric') {
				// Numeric columns work with trend analysis
				recommendedCharts.push(
					{
						type: 'line',
						xColumn: 'index',
						yColumn: column,
						title: `${column} Trend`,
						reason: 'Shows progression over time/order'
					},
					{
						type: 'bar',
						xColumn: 'index',
						yColumn: column,
						title: `${column} Values`,
						reason: 'Compare individual values'
					}
				);
			}

			return {
				column,
				type,
				uniqueValues,
				nullValues,
				sampleValues,
				recommendedCharts
			};
		});
	}, [data, columns]);

	// Generate cross-column recommendations
	const crossColumnRecommendations = useMemo(() => {
		if (columnInsights.length < 2) return [];

		const recommendations: Array<{
			type: 'bar' | 'line' | 'donut' | 'pie';
			xColumn: string;
			yColumn: string;
			title: string;
			reason: string;
		}> = [];

		const categoricalColumns = columnInsights.filter(col => col.type === 'categorical');
		const numericColumns = columnInsights.filter(col => col.type === 'numeric');

		// Categorical vs Numeric combinations
		categoricalColumns.forEach(catCol => {
			numericColumns.forEach(numCol => {
				recommendations.push({
					type: 'bar',
					xColumn: catCol.column,
					yColumn: numCol.column,
					title: `${numCol.column} by ${catCol.column}`,
					reason: `Compare ${numCol.column} across different ${catCol.column} categories`
				});
			});
		});

		// Numeric vs Numeric (scatter would be ideal, but we'll use line for now)
		for (let i = 0; i < numericColumns.length; i++) {
			for (let j = i + 1; j < numericColumns.length; j++) {
				recommendations.push({
					type: 'line',
					xColumn: numericColumns[i].column,
					yColumn: numericColumns[j].column,
					title: `${numericColumns[j].column} vs ${numericColumns[i].column}`,
					reason: 'Explore relationship between numeric values'
				});
			}
		}

		return recommendations.slice(0, 6); // Limit to 6 recommendations
	}, [columnInsights]);

	const getTypeIcon = (type: string) => {
		switch (type) {
			case 'numeric': return '🔢';
			case 'categorical': return '🏷️';
			case 'date': return '📅';
			default: return '❓';
		}
	};

	const getChartIcon = (type: string) => {
		switch (type) {
			case 'bar': return '📊';
			case 'line': return '📈';
			case 'donut': return '🍩';
			case 'pie': return '🥧';
			default: return '📊';
		}
	};

	return (
		<div className="h-full overflow-y-auto">
			<div className="p-4">
				<h2 className="text-lg font-semibold text-white mb-4">Quick Insights</h2>

				{/* Dataset Overview */}
				<div className="bg-gray-700 rounded-lg p-4 mb-6">
					<h3 className="text-md font-medium text-white mb-3">Dataset Overview</h3>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-gray-300">Rows:</span>
							<span className="text-white font-medium">{data.length.toLocaleString()}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-300">Columns:</span>
							<span className="text-white font-medium">{columns.filter(c => c !== 'index' && c !== 'count').length}</span>
						</div>
					</div>
				</div>

				{/* Backend AI Recommendations */}
				{recommendations && recommendations.length > 0 && (
					<div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6">
						<h3 className="text-md font-medium text-white mb-3 flex items-center space-x-2">
							<span>🤖</span>
							<span>AI Recommendations</span>
						</h3>
						<div className="space-y-2">
							{recommendations.slice(0, 4).map((rec: any, idx) => (
								<button
									key={idx}
									onClick={() => onCreateChart({
										type: rec.chart_type || rec.type,
										title: rec.title,
										xColumn: rec.x_column || rec.xColumn,
										yColumn: rec.y_column || rec.yColumn
									})}
									className="w-full text-left p-3 bg-blue-800/20 hover:bg-blue-700/30 border border-blue-600/30 rounded transition-colors"
								>
									<div className="flex items-center justify-between mb-1">
										<div className="flex items-center space-x-2">
											<span>{getChartIcon(rec.chart_type || rec.type)}</span>
											<span className="text-white font-medium text-sm">{rec.title}</span>
										</div>
										<div className="flex items-center space-x-1">
											<div className="text-xs text-blue-300 font-medium">
												{Math.round((rec.confidence || 0.8) * 100)}%
											</div>
											<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
											</svg>
										</div>
									</div>
									<div className="text-xs text-gray-400">{rec.reason}</div>
									<div className="text-xs text-blue-400 mt-1">
										{rec.x_column || rec.xColumn} × {rec.y_column || rec.yColumn}
									</div>
								</button>
							))}
						</div>
					</div>
				)}

				{/* Column Insights */}
				<div className="mb-6">
					<h3 className="text-md font-medium text-white mb-3">Column Analysis</h3>
					<div className="space-y-3">
						{columnInsights.map((insight) => (
							<div key={insight.column} className="bg-gray-700 rounded-lg p-3">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center space-x-2">
										<span>{getTypeIcon(insight.type)}</span>
										<span className="text-white font-medium text-sm">{insight.column}</span>
									</div>
									<span className="text-xs text-gray-400 capitalize">{insight.type}</span>
								</div>
								
								<div className="text-xs text-gray-400 mb-3">
									{insight.uniqueValues} unique • {insight.nullValues} null
								</div>

								{/* Sample values */}
								{insight.sampleValues.length > 0 && (
									<div className="mb-3">
										<div className="text-xs text-gray-400 mb-1">Sample values:</div>
										<div className="text-xs text-gray-300">
											{insight.sampleValues.slice(0, 3).map(val => String(val)).join(', ')}
											{insight.sampleValues.length > 3 && '...'}
										</div>
									</div>
								)}

								{/* Recommended charts */}
								{insight.recommendedCharts.length > 0 && (
									<div>
										<div className="text-xs text-gray-400 mb-2">Recommended charts:</div>
										<div className="space-y-1">
											{insight.recommendedCharts.slice(0, 2).map((rec, idx) => (
												<button
													key={idx}
													onClick={() => onCreateChart({
														type: rec.type,
														title: rec.title,
														xColumn: rec.xColumn,
														yColumn: rec.yColumn
													})}
													className="w-full text-left p-2 bg-gray-600 hover:bg-gray-500 rounded text-xs transition-colors"
												>
													<div className="flex items-center justify-between">
														<div className="flex items-center space-x-2">
															<span>{getChartIcon(rec.type)}</span>
															<span className="text-white">{rec.title}</span>
														</div>
														<svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
														</svg>
													</div>
													<div className="text-gray-400 mt-1">{rec.reason}</div>
												</button>
											))}
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Cross-Column Recommendations */}
				{crossColumnRecommendations.length > 0 && (
					<div>
						<h3 className="text-md font-medium text-white mb-3">Smart Combinations</h3>
						<div className="space-y-2">
							{crossColumnRecommendations.map((rec, idx) => (
								<button
									key={idx}
									onClick={() => onCreateChart({
										type: rec.type,
										title: rec.title,
										xColumn: rec.xColumn,
										yColumn: rec.yColumn
									})}
									className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
								>
									<div className="flex items-center justify-between mb-1">
										<div className="flex items-center space-x-2">
											<span>{getChartIcon(rec.type)}</span>
											<span className="text-white font-medium text-sm">{rec.title}</span>
										</div>
										<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
										</svg>
									</div>
									<div className="text-xs text-gray-400">{rec.reason}</div>
								</button>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};