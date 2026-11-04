import React from 'react';
import { computeStats, Sparkline } from './Stats';
import { useDatasets } from '../state/DatasetsContext';

type PreviewRow = Record<string, string | number | null>;

export const DataGrid: React.FC = () => {
	const { selectedId, preview, isLoading } = useDatasets();
	const [hoverInfo, setHoverInfo] = React.useState<{ col: string; stats: ReturnType<typeof computeStats>; sample: number[] } | null>(null);
	const rows: PreviewRow[] = preview?.data ?? [];
	const columns: string[] = preview?.columns ?? (rows.length > 0 ? Object.keys(rows[0]) : []);
	const error: string | null = null;

	return (
		<div className="glass h-full overflow-auto">
			{/* Loading State */}
			{isLoading && (
				<div className="flex items-center justify-center h-32">
					<div className="text-center">
						<div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
						<p className="text-gray-400 text-sm">Loading dataset preview...</p>
					</div>
				</div>
			)}

			{/* Error State */}
			{error && !isLoading && (
				<div className="flex items-center justify-center h-32">
					<div className="text-center">
						<div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
							<svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						</div>
						<p className="text-red-400 text-sm mb-1">Error loading dataset</p>
						<p className="text-gray-500 text-xs">{error}</p>
					</div>
				</div>
			)}

			{/* No Dataset Selected */}
			{!selectedId && !isLoading && !error && (
				<div className="flex items-center justify-center h-32">
					<div className="text-center">
						<div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
							<svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<p className="text-gray-400 text-sm mb-1">No dataset selected</p>
						<p className="text-gray-500 text-xs">Choose a dataset from the sidebar to view its contents</p>
					</div>
				</div>
			)}

			{/* Dataset Selection Prompt */}
			{!selectedId && !isLoading && !error && (
				<div className="mt-4 text-center">
					<div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
						<svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span className="text-blue-400 text-sm">Select a dataset from the dropdown above to start exploring your data</span>
					</div>
				</div>
			)}

			{/* Data Table */}
			{!isLoading && !error && selectedId && rows.length > 0 && (
				<table className="min-w-full text-sm">
					<thead className="sticky top-0 bg-white/10 backdrop-blur">
						<tr>
							{columns.map((c) => (
								<th key={c} className="text-left font-semibold px-3 py-2 border-b border-white/10 sticky top-0 z-10">{c}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((r, idx) => (
							<tr key={idx} className={idx % 2 === 0 ? "bg-white/5 hover:bg-white/10" : "hover:bg-white/10"}>
								{columns.map((c) => (
									<td
										key={c}
										className="px-3 py-2 border-b border-white/5"
										onMouseEnter={() => {
											const sample = rows
												.map((row) => Number(row[c] as number))
												.filter((v) => Number.isFinite(v))
												.slice(0, 200);
											const stats = computeStats(sample);
											setHoverInfo({ col: c, stats, sample });
										}}
										onMouseLeave={() => setHoverInfo(null)}
									>
										{String(r[c] ?? '')}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			)}

			{/* Empty Dataset */}
			{!isLoading && !error && selectedId && rows.length === 0 && (
				<div className="flex items-center justify-center h-32">
					<div className="text-center">
						<div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
							<svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
							</svg>
						</div>
						<p className="text-yellow-400 text-sm mb-1">Dataset is empty</p>
						<p className="text-gray-500 text-xs">No data rows found in this dataset</p>
					</div>
				</div>
			)}
			{hoverInfo && hoverInfo.stats && (
				<div className="fixed bottom-14 right-6 glass p-3 text-sm w-72">
					<div className="font-semibold mb-1">{hoverInfo.col}</div>
					<div className="flex justify-between text-xs text-gray-300 mb-1">
						<span>min {hoverInfo.stats.min.toFixed(2)}</span>
						<span>max {hoverInfo.stats.max.toFixed(2)}</span>
					</div>
					<Sparkline values={hoverInfo.sample} />
					<div className="grid grid-cols-3 gap-2 mt-2 text-xs">
						<div className="glass p-1.5">
							<div className="text-gray-400">mean</div>
							<div>{hoverInfo.stats.mean.toFixed(2)}</div>
						</div>
						<div className="glass p-1.5">
							<div className="text-gray-400">median</div>
							<div>{hoverInfo.stats.median.toFixed(2)}</div>
						</div>
						<div className="glass p-1.5">
							<div className="text-gray-400">stdev</div>
							<div>{hoverInfo.stats.stdev.toFixed(2)}</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};


