import React, { useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { uploadFile, seedEnterpriseDemo } from '../services/api';
import { useDatasets } from '../state/DatasetsContext';
import { CloudArrowUpIcon, DocumentArrowUpIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export const UploadZone: React.FC = () => {
	const { refresh, select } = useDatasets();
	const [uploading, setUploading] = useState(false);
	const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
	const nativeInputRef = useRef<HTMLInputElement>(null);

	const processFiles = async (files: File[]) => {
		if (!files || files.length === 0) return;
		setUploading(true);
		let lastUploadedId: string | null = null;

		for (const file of files) {
			setUploadedFileName(file.name);
			try {
				const ds = await uploadFile(file);
				lastUploadedId = ds.id;
				toast.success(`Successfully uploaded ${file.name}`);
			} catch (e: any) {
				const msg = e?.response?.data?.detail || e?.message || 'Error processing file';
				toast.error(`Upload failed for ${file.name}: ${msg}`);
			}
		}

		await refresh();
		if (lastUploadedId) {
			select(lastUploadedId);
		}
		setUploading(false);
		setUploadedFileName(null);
	};

	const onDrop = React.useCallback((acceptedFiles: File[]) => {
		processFiles(acceptedFiles);
	}, []);

	const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const files = Array.from(e.target.files);
			processFiles(files);
			e.target.value = '';
		}
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		noClick: true, // We have explicit browse button and card click handler
		accept: {
			'text/*': ['.csv', '.txt', '.tsv'],
			'application/vnd.ms-excel': ['.csv', '.xls'],
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
			'application/json': ['.json'],
			'application/octet-stream': ['.csv', '.xls', '.xlsx', '.json'],
			'*/*': ['.csv', '.xlsx', '.xls', '.json']
		}
	});

	const handleSeedDemo = async (e: React.MouseEvent) => {
		e.stopPropagation();
		toast.loading('Loading Fortune 500 Enterprise Demo Datasets...', { id: 'seed' });
		try {
			const res = await seedEnterpriseDemo();
			toast.success(res.message || 'Enterprise datasets ready!', { id: 'seed' });
			await refresh();
		} catch {
			toast.error('Failed to load demo datasets', { id: 'seed' });
		}
	};

	return (
		<div 
			{...getRootProps()} 
			onClick={() => nativeInputRef.current?.click()}
			className={`glass flex-1 min-h-[300px] flex flex-col items-center justify-center border-dashed border-2 rounded-3xl p-8 cursor-pointer transition-all duration-300 relative overflow-hidden ${
				isDragActive 
					? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]' 
					: 'border-white/20 hover:border-cyan-500/50 hover:bg-white/5'
			}`}
		>
			<input {...getInputProps()} />
			<input 
				type="file" 
				ref={nativeInputRef} 
				onChange={handleNativeChange} 
				multiple 
				accept=".csv,.xlsx,.xls,.json,.txt,.tsv" 
				className="hidden" 
			/>

			{/* Decorative ambient background */}
			<div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

			<div className="text-center relative z-10 flex flex-col items-center max-w-md">
				<div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] mb-4 shadow-xl shadow-cyan-500/20 ${uploading ? 'animate-bounce' : 'hover:scale-105 transition-transform'}`}>
					<div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
						<CloudArrowUpIcon className="w-8 h-8 text-cyan-400" />
					</div>
				</div>

				<h3 className="text-xl font-bold text-white mb-2">
					{uploading 
						? `Uploading & Analyzing ${uploadedFileName || 'Dataset'}...` 
						: isDragActive 
						? 'Drop your dataset file here' 
						: 'Drop your CSV, Excel, or JSON dataset here'
					}
				</h3>

				<p className="text-slate-400 text-xs mb-6 max-w-sm">
					Supports CSV, Excel (.xlsx, .xls), JSON, and TSV files up to 100MB with automated schema profiling and AI analysis.
				</p>

				<div className="flex items-center gap-3">
					<button
						type="button"
						disabled={uploading}
						onClick={(e) => {
							e.stopPropagation();
							nativeInputRef.current?.click();
						}}
						className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105 disabled:opacity-50"
					>
						<DocumentArrowUpIcon className="w-4 h-4" />
						<span>{uploading ? 'Processing...' : 'Browse Files'}</span>
					</button>

					<button
						type="button"
						onClick={handleSeedDemo}
						className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all hover:border-purple-500/40 hover:text-purple-300"
					>
						<SparklesIcon className="w-4 h-4 text-purple-400" />
						<span>Load Sample Demo Data</span>
					</button>
				</div>
			</div>
		</div>
	);
};
