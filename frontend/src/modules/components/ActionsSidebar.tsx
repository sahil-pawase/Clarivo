import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { UploadZone } from '../shared/UploadZone';
import { useDatasets } from '../state/DatasetsContext';
import { useApp } from '../state/AppContext';
import toast from 'react-hot-toast';
import { API_BASE } from '../services/api';
import { 
	CloudArrowUpIcon, FolderIcon, ChartBarIcon, ArrowDownTrayIcon, 
	ArrowPathIcon, TrashIcon, XMarkIcon, SparklesIcon, DocumentChartBarIcon
} from '@heroicons/react/24/outline';

interface ActionsSidebarProps {
	isCollapsed: boolean;
}

export const ActionsSidebar: React.FC<ActionsSidebarProps> = ({ isCollapsed }) => {
	const [showUpload, setShowUpload] = useState(false);
	const [showManage, setShowManage] = useState(false);
	const [showQuickAnalysis, setShowQuickAnalysis] = useState(false);
	const [showExport, setShowExport] = useState(false);
	const [exporting, setExporting] = useState(false);
	const { datasets, refresh, select, selectedId } = useDatasets();
	const { charts } = useApp();

	const handleQuickAnalysis = () => {
		if (datasets.length === 0) {
			toast.error('Please upload a dataset first');
			return;
		}
		setShowQuickAnalysis(true);
	};

	const handleExport = () => {
		if (datasets.length === 0 && charts.length === 0) {
			toast.error('No data or charts to export');
			return;
		}
		setShowExport(true);
	};

	const handleDeleteDataset = async (datasetId: string) => {
		try {
			const response = await fetch(`${API_BASE}/datasets/${datasetId}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			
			toast.success('Dataset deleted');
			refresh();
		} catch (error) {
			toast.error('Failed to delete dataset');
			console.error('Delete error:', error);
		}
	};

	const handleExportDataset = async (format: string) => {
		if (datasets.length === 0) {
			toast.error('No datasets available to export');
			return;
		}
		
		const targetId = selectedId || datasets[0].id;
		const datasetToExport = datasets.find(d => d.id === targetId) || datasets[0];
		
		setExporting(true);
		try {
			const response = await fetch(`${API_BASE}/datasets/${datasetToExport.id}/export`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					export_type: format
				})
			});
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			
			const result = await response.json();
			toast.success(`Dataset exported as ${format.toUpperCase()}`);
			
			if (result.file_path) {
				const link = document.createElement('a');
				link.href = `${API_BASE.replace('/api/v1','')}${result.file_path}`;
				link.download = `${datasetToExport.name}.${format}`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		} catch (error) {
			toast.error(`Failed to export as ${format}`);
			console.error('Export error:', error);
		} finally {
			setExporting(false);
		}
	};

	// Portal Modal Container
	const renderModals = () => {
		if (typeof document === 'undefined') return null;

		return ReactDOM.createPortal(
			<>
				{/* Upload Modal */}
				{showUpload && (
					<div 
						className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
						onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
					>
						<div className="bg-slate-900/95 border border-white/15 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
							<div className="flex justify-between items-center mb-4">
								<div className="flex items-center gap-2">
									<CloudArrowUpIcon className="w-6 h-6 text-cyan-400" />
									<h2 className="text-xl font-bold text-white">Upload Dataset</h2>
								</div>
								<button 
									onClick={() => setShowUpload(false)}
									className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
								>
									<XMarkIcon className="w-6 h-6" />
								</button>
							</div>
							<UploadZone />
						</div>
					</div>
				)}

				{/* Manage Files Modal */}
				{showManage && (
					<div 
						className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
						onClick={(e) => { if (e.target === e.currentTarget) setShowManage(false); }}
					>
						<div className="bg-slate-900/95 border border-white/15 rounded-2xl w-full max-w-xl max-h-[80vh] p-6 shadow-2xl flex flex-col relative">
							<div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
								<div className="flex items-center gap-2">
									<FolderIcon className="w-6 h-6 text-purple-400" />
									<h2 className="text-xl font-bold text-white">Manage Datasets ({datasets.length})</h2>
								</div>
								<button 
									onClick={() => setShowManage(false)}
									className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
								>
									<XMarkIcon className="w-6 h-6" />
								</button>
							</div>
							<div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
								{datasets.length === 0 ? (
									<div className="text-center py-10 text-slate-400">
										<p>No datasets uploaded yet.</p>
										<button 
											onClick={() => { setShowManage(false); setShowUpload(true); }}
											className="mt-3 px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/30 transition-all text-sm font-medium"
										>
											Upload First Dataset
										</button>
									</div>
								) : (
									datasets.map(dataset => (
										<div 
											key={dataset.id} 
											className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
												selectedId === dataset.id 
													? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm' 
													: 'bg-white/5 border-white/10 hover:bg-white/10'
											}`}
										>
											<div className="cursor-pointer flex-1" onClick={() => { select(dataset.id); setShowManage(false); }}>
												<h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
													{dataset.name}
													{selectedId === dataset.id && (
														<span className="text-[10px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded font-mono">Active</span>
													)}
												</h3>
												<p className="text-xs text-slate-400 mt-0.5">
													{dataset.rows} rows • {dataset.columns} columns • {dataset.size > 0 ? (dataset.size / 1024).toFixed(1) + ' KB' : 'Ready'}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<button 
													onClick={() => { select(dataset.id); setShowManage(false); }}
													className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg transition-colors font-medium"
												>
													Select
												</button>
												<button 
													onClick={() => handleDeleteDataset(dataset.id)}
													className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors"
													title="Delete Dataset"
												>
													<TrashIcon className="w-4 h-4" />
												</button>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				)}

				{/* Quick Analysis Modal */}
				{showQuickAnalysis && (
					<div 
						className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
						onClick={(e) => { if (e.target === e.currentTarget) setShowQuickAnalysis(false); }}
					>
						<div className="bg-slate-900/95 border border-white/15 rounded-2xl w-full max-w-2xl max-h-[85vh] p-6 shadow-2xl flex flex-col relative">
							<div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
								<div className="flex items-center gap-2">
									<SparklesIcon className="w-6 h-6 text-amber-400" />
									<h2 className="text-xl font-bold text-white">Quick Data Insights</h2>
								</div>
								<button 
									onClick={() => setShowQuickAnalysis(false)}
									className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
								>
									<XMarkIcon className="w-6 h-6" />
								</button>
							</div>
							
							<div className="space-y-4 overflow-y-auto flex-1 pr-1">
								<div>
									<h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Dataset</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
										{datasets.map(dataset => (
											<div 
												key={dataset.id} 
												onClick={() => select(dataset.id)}
												className={`p-3 rounded-xl border cursor-pointer transition-all ${
													selectedId === dataset.id 
														? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-sm' 
														: 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
												}`}
											>
												<div className="font-semibold text-sm truncate">{dataset.name}</div>
												<div className="text-xs text-slate-400 mt-1">
													{dataset.rows} rows • {dataset.columns} cols
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="p-4 bg-slate-950/60 rounded-xl border border-white/10 space-y-2">
									<h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
										<DocumentChartBarIcon className="w-4 h-4 text-cyan-400" />
										Recommended Actions
									</h3>
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
										<button 
											onClick={() => {
												setShowQuickAnalysis(false);
												// trigger view navigation
												window.location.hash = 'visualize';
											}}
											className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all"
										>
											<div className="font-semibold text-xs text-cyan-300">📊 Chart Studio</div>
											<div className="text-[11px] text-slate-400 mt-0.5">Plot histograms, scatters & bars</div>
										</button>
										<button 
											onClick={() => {
												setShowQuickAnalysis(false);
												window.location.hash = 'insights';
											}}
											className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all"
										>
											<div className="font-semibold text-xs text-purple-300">💡 AI Insights</div>
											<div className="text-[11px] text-slate-400 mt-0.5">Ask questions about trends</div>
										</button>
										<button 
											onClick={() => {
												setShowQuickAnalysis(false);
												window.location.hash = 'cleaning';
											}}
											className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all"
										>
											<div className="font-semibold text-xs text-emerald-300">✨ Auto Clean</div>
											<div className="text-[11px] text-slate-400 mt-0.5">Impute nulls and normalize</div>
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Export Modal */}
				{showExport && (
					<div 
						className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
						onClick={(e) => { if (e.target === e.currentTarget) setShowExport(false); }}
					>
						<div className="bg-slate-900/95 border border-white/15 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
							<div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
								<div className="flex items-center gap-2">
									<ArrowDownTrayIcon className="w-6 h-6 text-indigo-400" />
									<h2 className="text-xl font-bold text-white">Export Dataset</h2>
								</div>
								<button 
									onClick={() => setShowExport(false)}
									className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
								>
									<XMarkIcon className="w-6 h-6" />
								</button>
							</div>
							
							<div className="space-y-4">
								<p className="text-xs text-slate-400">
									Select your preferred export format for <span className="text-white font-semibold">{datasets.find(d => d.id === selectedId)?.name || datasets[0]?.name || 'dataset'}</span>:
								</p>

								<div className="grid grid-cols-3 gap-3">
									<button 
										onClick={() => handleExportDataset('csv')}
										disabled={exporting}
										className="p-4 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
									>
										<span className="text-xl font-mono text-cyan-400">.CSV</span>
										<span className="text-xs text-slate-300 font-medium">Standard CSV</span>
									</button>
									<button 
										onClick={() => handleExportDataset('excel')}
										disabled={exporting}
										className="p-4 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
									>
										<span className="text-xl font-mono text-emerald-400">.XLSX</span>
										<span className="text-xs text-slate-300 font-medium">Excel Sheet</span>
									</button>
									<button 
										onClick={() => handleExportDataset('json')}
										disabled={exporting}
										className="p-4 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
									>
										<span className="text-xl font-mono text-amber-400">.JSON</span>
										<span className="text-xs text-slate-300 font-medium">JSON Records</span>
									</button>
								</div>

								{exporting && (
									<div className="flex items-center justify-center gap-2 text-xs text-indigo-400 pt-2">
										<div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
										Exporting dataset file...
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</>,
			document.body
		);
	};

	// Collapsed View
	if (isCollapsed) {
		return (
			<>
				<div className="bg-slate-900/60 border border-white/10 rounded-2xl h-full flex flex-col items-center py-4 space-y-3 px-2 backdrop-blur-xl relative">
					<button
						onClick={() => setShowUpload(true)}
						title="Upload Dataset"
						className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 flex items-center justify-center transition-all hover:scale-105 shadow-md"
					>
						<CloudArrowUpIcon className="w-5 h-5" />
					</button>
					<button
						onClick={() => setShowManage(true)}
						title="Manage Datasets"
						className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-400 text-purple-400 flex items-center justify-center transition-all hover:scale-105 shadow-md"
					>
						<FolderIcon className="w-5 h-5" />
					</button>
					<button
						onClick={handleQuickAnalysis}
						title="Quick Analysis"
						className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-400 text-amber-400 flex items-center justify-center transition-all hover:scale-105 shadow-md"
					>
						<ChartBarIcon className="w-5 h-5" />
					</button>
					<button
						onClick={handleExport}
						title="Export Data"
						className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 hover:border-indigo-400 text-indigo-400 flex items-center justify-center transition-all hover:scale-105 shadow-md"
					>
						<ArrowDownTrayIcon className="w-5 h-5" />
					</button>
				</div>
				{renderModals()}
			</>
		);
	}

	// Expanded View
	return (
		<>
			<div className="bg-slate-900/60 border border-white/10 rounded-2xl h-full flex flex-col backdrop-blur-xl relative overflow-hidden">
				{/* Top Header */}
				<div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between">
					<div>
						<h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-300">
							Workspace Actions
						</h3>
						<p className="text-[11px] text-slate-400">Manage data & pipelines</p>
					</div>
					<button
						onClick={refresh}
						title="Refresh Datasets"
						className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
					>
						<ArrowPathIcon className="w-4 h-4" />
					</button>
				</div>

				{/* Scrollable Action Cards */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3.5">
					{/* Action Buttons Grid */}
					<div className="grid grid-cols-2 gap-2.5">
						<button
							onClick={() => setShowUpload(true)}
							className="p-3 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl flex flex-col items-start gap-1.5 transition-all hover:scale-[1.02] text-left group"
						>
							<div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
								<CloudArrowUpIcon className="w-4 h-4" />
							</div>
							<div className="font-semibold text-xs text-slate-100">Upload</div>
							<div className="text-[10px] text-slate-400">CSV, Excel, JSON</div>
						</button>

						<button
							onClick={() => setShowManage(true)}
							className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl flex flex-col items-start gap-1.5 transition-all hover:scale-[1.02] text-left group"
						>
							<div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
								<FolderIcon className="w-4 h-4" />
							</div>
							<div className="font-semibold text-xs text-slate-100">Manage</div>
							<div className="text-[10px] text-slate-400">{datasets.length} Datasets</div>
						</button>

						<button
							onClick={handleQuickAnalysis}
							className="p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 hover:border-amber-400/50 rounded-xl flex flex-col items-start gap-1.5 transition-all hover:scale-[1.02] text-left group"
						>
							<div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
								<ChartBarIcon className="w-4 h-4" />
							</div>
							<div className="font-semibold text-xs text-slate-100">Analyze</div>
							<div className="text-[10px] text-slate-400">Quick Insights</div>
						</button>

						<button
							onClick={handleExport}
							className="p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/30 hover:border-indigo-400/50 rounded-xl flex flex-col items-start gap-1.5 transition-all hover:scale-[1.02] text-left group"
						>
							<div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
								<ArrowDownTrayIcon className="w-4 h-4" />
							</div>
							<div className="font-semibold text-xs text-slate-100">Export</div>
							<div className="text-[10px] text-slate-400">Data & Charts</div>
						</button>
					</div>

					{/* Dataset Quick Stats */}
					<div className="p-3 bg-white/5 border border-white/10 rounded-xl">
						<div className="flex items-center justify-between text-xs text-slate-400 mb-2">
							<span className="font-medium text-slate-300">Quick Summary</span>
							<span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">Live</span>
						</div>
						<div className="grid grid-cols-2 gap-2 text-center">
							<div className="p-2 bg-white/5 rounded-lg border border-white/5">
								<div className="text-lg font-bold text-cyan-400">{datasets.length}</div>
								<div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Datasets</div>
							</div>
							<div className="p-2 bg-white/5 rounded-lg border border-white/5">
								<div className="text-lg font-bold text-purple-400">{charts.length}</div>
								<div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Charts</div>
							</div>
						</div>
					</div>

					{/* Active Datasets List */}
					<div>
						<div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
							<span className="font-semibold uppercase tracking-wider text-[10px]">Loaded Datasets</span>
							<span className="text-[10px]">{datasets.length} total</span>
						</div>
						<div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
							{datasets.map(ds => (
								<div
									key={ds.id}
									onClick={() => select(ds.id)}
									className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
										selectedId === ds.id 
											? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-sm' 
											: 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
									}`}
								>
									<div className="font-medium text-xs truncate flex items-center justify-between">
										<span className="truncate">{ds.name}</span>
										{selectedId === ds.id && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
									</div>
									<div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
										<span>{ds.rows} rows</span>
										<span>•</span>
										<span>{ds.columns} cols</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
			{renderModals()}
		</>
	);
};
