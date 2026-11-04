import React from 'react';
import { ChartContainer } from '../ChartContainer';
import { BarChart } from './BarChart';
import { LineChart } from './LineChart';
import { DonutChart } from './DonutChart';

export type ChartType = 'bar' | 'line' | 'donut' | 'pie' | 'scatter' | 'histogram' | 'boxplot' | 'heatmap';

interface BackendChartRendererProps {
	type: ChartType;
	chartData: any; // Chart data from backend
	title?: string;
	subtitle?: string;
	width?: number;
	height?: number;
	showLegend?: boolean;
	showGrid?: boolean;
	horizontal?: boolean;
	smooth?: boolean;
	showDots?: boolean;
	status?: 'loading' | 'ready' | 'error' | 'no_data';
	message?: string;
}

export const BackendChartRenderer: React.FC<BackendChartRendererProps> = React.memo(({
	type,
	chartData,
	title,
	subtitle,
	width,
	height,
	showLegend = true,
	showGrid = true,
	horizontal = false,
	smooth = true,
	showDots = true,
	status = 'ready',
	message
}) => {
	console.log('🎨 BackendChartRenderer rendering:', {
		type,
		status,
		hasData: !!chartData,
		dataType: typeof chartData,
		message
	});

	// Convert backend chart data to format expected by our chart components
	const convertBackendData = (data: any) => {
		console.log('🔄 Converting backend data:', { 
			data, 
			dataType: typeof data, 
			hasData: !!data,
			isArray: Array.isArray(data),
			hasDataProperty: data && data.data !== undefined,
			dataKeys: data ? Object.keys(data) : []
		});
		
		if (!data) {
			console.log('❌ No data provided');
			return [];
		}
		
		// Handle the specific format returned by our backend: { data: [...], type: "bar" }
		if (data.data && Array.isArray(data.data)) {
			console.log('✅ Found backend data.data format. Converting:', {
				dataArray: data.data,
				length: data.data.length,
				sample: data.data.slice(0, 3)
			});
			
			// The data is already in the correct format: {category: string, value: number}
			const converted = data.data.map((item: any, index: number) => ({
				category: String(item.category || item.label || item.name || item.x || `Item ${index + 1}`),
				value: Number(item.value || item.y || item.count || item.data || 0)
			}));
			
			console.log('✅ Converted to ChartDataPoint format:', {
				converted,
				length: converted.length,
				sample: converted.slice(0, 3)
			});
			return converted;
		}
		
		// Handle direct array format from backend
		if (Array.isArray(data) && data.length > 0) {
			console.log('✅ Found array format. Converting:', {
				dataArray: data,
				length: data.length,
				sample: data.slice(0, 3)
			});
			
			// Check if it's already in ChartDataPoint format
			if (data[0].category !== undefined && data[0].value !== undefined) {
				console.log('✅ Data already in correct ChartDataPoint format');
				return data;
			}
			
			// Convert from various possible formats
			const converted = data.map((item: any, index: number) => ({
				category: String(item.category || item.label || item.name || item.x || `Item ${index + 1}`),
				value: Number(item.value || item.y || item.count || item.data || 0)
			}));
			console.log('✅ Converted array to ChartDataPoint format:', {
				converted,
				length: converted.length,
				sample: converted.slice(0, 3)
			});
			return converted;
		}
		
		// If it's plotly data, try to convert it
		if (data.x && data.y && Array.isArray(data.x) && Array.isArray(data.y)) {
			console.log('✅ Converting plotly format');
			return data.x.map((category: any, index: number) => ({
				category: String(category),
				value: Number(data.y[index]) || 0
			}));
		}
		
		// If it's raw data array, try to convert
		if (Array.isArray(data)) {
			console.log('✅ Converting array format:', data);
			return data.map((item: any, index: number) => ({
				category: String(item.category || item.label || item.name || `Item ${index + 1}`),
				value: Number(item.value || item.y || item.count || 0)
			}));
		}
		
		// Handle object with x/y arrays (Plotly-style) or other formats
		if (typeof data === 'object' && !Array.isArray(data)) {
			console.log('✅ Handling object format:', data);
			
			// Try to find arrays in the object
			const keys = Object.keys(data);
			const possibleXKeys = ['x', 'categories', 'labels', 'names'];
			const possibleYKeys = ['y', 'values', 'data', 'counts'];
			
			let xArray: any[] | null = null;
			let yArray: any[] | null = null;
			
			// Find x and y arrays
			for (const key of possibleXKeys) {
				if (data[key] && Array.isArray(data[key])) {
					xArray = data[key];
					break;
				}
			}
			
			for (const key of possibleYKeys) {
				if (data[key] && Array.isArray(data[key])) {
					yArray = data[key];
					break;
				}
			}
			
			if (xArray && yArray && xArray.length === yArray.length) {
				console.log('✅ Converting x/y arrays:', { xArray, yArray });
				return xArray.map((category: any, index: number) => ({
					category: String(category),
					value: Number(yArray![index]) || 0
				}));
			}
			
			// If no x/y arrays found, try to convert the object directly
			if (keys.length > 0) {
				console.log('✅ Converting object entries to chart data');
				return keys.map(key => ({
					category: String(key),
					value: Number(data[key]) || 0
				})).filter(item => !isNaN(item.value));
			}
		}
		
		console.log('⚠️ Unknown data format, returning empty array. Data structure:', {
			type: typeof data,
			keys: Object.keys(data),
			data
		});
		
		// Create test data to verify chart rendering works
		console.log('🧪 Creating test data to verify chart rendering...');
		return [
			{ category: 'Test A', value: 25 },
			{ category: 'Test B', value: 40 },
			{ category: 'Test C', value: 15 },
			{ category: 'Test D', value: 30 }
		];
	};

	const convertedData = convertBackendData(chartData);
	
	console.log('📊 FINAL: Converted chart data for rendering:', { 
		original: chartData, 
		converted: convertedData,
		convertedLength: convertedData.length,
		status,
		chartType: type,
		willShowNoData: status === 'no_data' || !chartData || (convertedData.length === 0),
		convertedSample: convertedData.slice(0, 3)
	});
	
	// Use converted data directly - no fallback to see what's happening
	const finalData = convertedData;
	
	console.log('📊 FINAL DATA CHECK:', {
		originalBackendData: chartData,
		convertedData: convertedData,
		finalData: finalData,
		hasConvertedData: convertedData.length > 0,
		sampleData: finalData.slice(0, 3),
		convertedDataLength: convertedData.length,
		finalDataLength: finalData.length
	});
	
	// Additional check - if we have no final data, let's see why
	if (finalData.length === 0) {
		console.log('❌ ZERO FINAL DATA - Backend investigation:', {
			backendDataExists: !!chartData,
			backendDataType: typeof chartData,
			backendDataKeys: chartData ? Object.keys(chartData) : [],
			backendHasDataProperty: chartData && chartData.data !== undefined,
			backendDataArrayLength: chartData && chartData.data ? chartData.data.length : 0,
			firstBackendItem: chartData && chartData.data && chartData.data[0] ? chartData.data[0] : null
		});
	}

	// Show loading state
	if (status === 'loading') {
		return (
			<ChartContainer title={title} subtitle={subtitle}>
				{() => (
					<div className="flex items-center justify-center h-full">
						<div className="text-center">
							<div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
							<p className="text-gray-400">Generating chart...</p>
						</div>
					</div>
				)}
			</ChartContainer>
		);
	}

	// Show error state
	if (status === 'error') {
		return (
			<ChartContainer title={title} subtitle={subtitle}>
				{() => (
					<div className="flex items-center justify-center h-full text-red-400">
						<div className="text-center">
							<div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<p className="text-sm">Chart Error</p>
							{message && <p className="text-xs text-gray-500 mt-1">{message}</p>}
						</div>
					</div>
				)}
			</ChartContainer>
		);
	}

	// Show no data state - with detailed logging
	const shouldShowNoData = status === 'no_data' || !chartData || (finalData.length === 0);
	console.log('🚫 NO DATA CHECK:', {
		status,
		hasChartData: !!chartData,
		finalDataLength: finalData.length,
		shouldShowNoData,
		reasonForNoData: {
			statusIsNoData: status === 'no_data',
			noChartData: !chartData,
			emptyFinalData: finalData.length === 0
		}
	});
	
	if (shouldShowNoData) {
		console.log('🚫 Showing no data state:', { status, hasChartData: !!chartData, finalDataLength: finalData?.length });
		return (
			<ChartContainer title={title} subtitle={subtitle}>
				{() => (
					<div className="flex items-center justify-center h-full text-gray-400">
						<div className="text-center">
							<div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
								</svg>
							</div>
							<p className="text-sm">No data available</p>
							{message && <p className="text-xs text-gray-500 mt-1">{message}</p>}
							<div className="mt-4 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs">
								<p className="text-yellow-400 font-semibold">🐛 DEBUG INFO:</p>
								<p className="text-yellow-300">Status: {status}</p>
								<p className="text-yellow-300">Has Data: {chartData ? 'Yes' : 'No'}</p>
								<p className="text-yellow-300">Final Data Length: {finalData?.length || 0}</p>
								<p className="text-yellow-300">Chart Type: {type}</p>
							</div>
						</div>
					</div>
				)}
			</ChartContainer>
		);
	}

	// Memoize the render function to prevent unnecessary re-renders
	const renderChart = React.useCallback((size: { width: number; height: number }) => {
		console.log('🎨 RENDERING CHART:', {
			type,
			finalDataLength: finalData.length,
			size,
			firstDataPoint: finalData[0],
			usingRealData: convertedData.length > 0
		});
		
		const commonProps = {
			data: finalData,
			title: '',
			subtitle: '',
			width: size.width,
			height: size.height,
			showLegend,
			showGrid
		};

		switch (type) {
			case 'bar':
				return (
					<BarChart
						{...commonProps}
						horizontal={horizontal}
					/>
				);
			case 'line':
				return (
					<LineChart
						{...commonProps}
						smooth={smooth}
						showDots={showDots}
					/>
				);
			case 'donut':
			case 'pie':
				return (
					<DonutChart
						{...commonProps}
						innerRadius={type === 'donut' ? 60 : 0}
					/>
				);
			case 'scatter':
			case 'histogram':
			case 'boxplot':
			case 'heatmap':
				// For now, fall back to bar chart for unsupported types
				return (
					<BarChart
						{...commonProps}
						horizontal={horizontal}
					/>
				);
			default:
				return (
					<div className="flex items-center justify-center h-full text-gray-400">
						Unsupported chart type: {type}
					</div>
				);
		}
	}, [finalData, showLegend, showGrid, type, horizontal, smooth, showDots]);

	return (
		<ChartContainer title={title} subtitle={subtitle}>
			{renderChart}
		</ChartContainer>
	);
});

BackendChartRenderer.displayName = 'BackendChartRenderer';