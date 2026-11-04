import React from 'react';
import { DataGrid } from '../shared/DataGrid';
import { useDatasets } from '../state/DatasetsContext';
import { computeStats } from '../shared/Stats';

export const ViewDataset: React.FC = () => {
	const { datasets, selectedId, select, refresh, preview } = useDatasets();
	const selectedDataset = datasets.find(d => d.id === selectedId);
	const [isRefreshing, setIsRefreshing] = React.useState(false);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refresh();
		} finally {
			setIsRefreshing(false);
		}
	};

	return (
		<div className="h-full flex flex-col gap-4 p-4">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
							<svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<div>
							<h2 className="text-xl font-semibold text-white">Dataset Viewer</h2>
							<p className="text-sm text-gray-400">Explore and analyze your data</p>
						</div>
					</div>
					
					{/* Dataset Selector */}
					<div className="flex items-center gap-2">
						<label className="text-sm text-gray-400 font-medium">Dataset:</label>
						<select 
							value={selectedId ?? ''} 
							onChange={(e) => select(e.target.value || null)} 
							className="h-9 px-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all min-w-[200px]"
						>
							<option value="" className="bg-gray-800 text-white">Select a dataset</option>
							{datasets.map(d => (
								<option key={d.id} value={d.id} className="bg-gray-800 text-white hover:bg-gray-700">
									{d.name}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Refresh Button */}
				<button
					onClick={handleRefresh}
					disabled={isRefreshing}
					className="h-9 px-4 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 transition-all flex items-center gap-2"
				>
					<svg 
						className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
						fill="none" 
						stroke="currentColor" 
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					{isRefreshing ? 'Refreshing...' : 'Refresh'}
				</button>
			</div>

			{/* Dataset Info Bar */}
			{selectedDataset && (
				<div className="bg-gradient-to-r from-white/10 to-white/5 rounded-lg p-4 border border-white/20">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-6">
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-400">{selectedDataset.rows.toLocaleString()}</div>
								<div className="text-xs text-gray-400">Rows</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-green-400">{selectedDataset.columns}</div>
								<div className="text-xs text-gray-400">Columns</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-purple-400">{(selectedDataset.size / 1024).toFixed(1)}</div>
								<div className="text-xs text-gray-400">KB</div>
							</div>
						</div>
						<div className="text-right">
							<div className="text-sm font-medium text-white">{selectedDataset.name}</div>
							<div className="text-xs text-gray-400">Last updated: {new Date(selectedDataset.uploaded_at).toLocaleDateString()}</div>
						</div>
					</div>
				</div>
			)}

			{/* Statistics and Data View */}
			{selectedDataset && preview?.data && preview.data.length > 0 && (
				<div className="flex-1 min-h-0 flex gap-4">
					{/* Statistics Panel */}
					<div className="w-1/3 bg-gradient-to-r from-white/10 to-white/5 rounded-lg p-4 border border-white/20 overflow-y-auto">
						<div className="flex items-center gap-2 mb-3">
							<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
							<h3 className="text-lg font-semibold text-white">Column Statistics</h3>
						</div>
						<div className="space-y-3">
							{preview.columns.map((column) => {
								const numericValues = preview.data
									.map((row: any) => Number(row[column]))
									.filter((v: number) => Number.isFinite(v));
								
								if (numericValues.length === 0) {
									// Get text values for non-numeric columns
									const textValues = preview.data
										.map((row: any) => String(row[column] || ''))
										.filter((v: string) => v.trim() !== '');
									
									return (
										<div key={column} className="bg-white/5 rounded-lg p-3 border border-white/10">
											<div className="text-sm font-medium text-white mb-2">{column}</div>
											<div className="text-xs text-gray-400 mb-2">Non-numeric data ({textValues.length} values)</div>
											<div className="text-xs">
												<div className="text-gray-400 mb-1">Sample Data:</div>
												<div className="bg-white/5 rounded p-2 max-h-20 overflow-y-auto">
													{textValues.slice(0, 10).map((value, idx) => (
														<div key={idx} className="text-gray-300 truncate">
															{value}
														</div>
													))}
													{textValues.length > 10 && (
														<div className="text-gray-500 italic">
															... and {textValues.length - 10} more values
														</div>
													)}
												</div>
											</div>
										</div>
									);
								}

								const stats = computeStats(numericValues);
								if (!stats) return null;

								return (
									<div key={column} className="bg-white/5 rounded-lg p-3 border border-white/10">
										<div className="text-sm font-medium text-white mb-3">{column}</div>
										<div className="grid grid-cols-3 gap-2 text-xs mb-3">
											<div className="text-center">
												<div className="text-gray-400 mb-1">Mean</div>
												<div className="text-blue-400 font-semibold">{stats.mean.toFixed(2)}</div>
											</div>
											<div className="text-center">
												<div className="text-gray-400 mb-1">Median</div>
												<div className="text-green-400 font-semibold">{stats.median.toFixed(2)}</div>
											</div>
											<div className="text-center">
												<div className="text-gray-400 mb-1">Std Dev</div>
												<div className="text-purple-400 font-semibold">{stats.stdev.toFixed(2)}</div>
											</div>
										</div>
										<div className="text-xs text-gray-400 mb-2">
											Range: {stats.min.toFixed(2)} - {stats.max.toFixed(2)} ({stats.count} values)
										</div>
										<div className="text-xs">
											<div className="text-gray-400 mb-1">Sample Data:</div>
											<div className="bg-white/5 rounded p-2 max-h-20 overflow-y-auto">
												{numericValues.slice(0, 10).map((value, idx) => (
													<div key={idx} className="text-gray-300">
														{value.toFixed(2)}
													</div>
												))}
												{numericValues.length > 10 && (
													<div className="text-gray-500 italic">
														... and {numericValues.length - 10} more values
													</div>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Data Table Panel */}
					<div className="flex-1 bg-gradient-to-r from-white/10 to-white/5 rounded-lg border border-white/20 overflow-hidden">
						<div className="flex items-center gap-2 p-4 border-b border-white/10">
							<svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<h3 className="text-lg font-semibold text-white">Dataset Table</h3>
							<span className="text-sm text-gray-400">({preview.data.length} rows shown)</span>
						</div>
						<div className="h-full overflow-auto">
							<DataGrid />
						</div>
					</div>
				</div>
			)}

			{/* No Datasets Available */}
			{datasets.length === 0 && (
				<div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-8 border border-yellow-500/20 text-center">
					<div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
						</svg>
					</div>
					<h3 className="text-lg font-semibold text-yellow-400 mb-2">No Datasets Available</h3>
					<p className="text-gray-400 mb-4">Upload your first dataset to get started with data analysis</p>
					<button
						onClick={handleRefresh}
						className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-medium"
					>
						Refresh
					</button>
				</div>
			)}

			{/* Show DataGrid only when no dataset is selected or no data available */}
			{(!selectedDataset || !preview?.data || preview.data.length === 0) && selectedId && (
				<div className="flex-1 min-h-0">
					<DataGrid />
				</div>
			)}
		</div>
	);
};


