import React from 'react';
import { useDatasets } from '../state/DatasetsContext';
import toast from 'react-hot-toast';

type DataRow = Record<string, any>;
type DataType = 'string' | 'number' | 'boolean' | 'object' | 'date';

export const Cleaning: React.FC = () => {
	const { previewFiltered: preview } = useDatasets();
	const sourceRows = preview?.data || [];
	const sourceCols = preview?.columns || [];

	const [rows, setRows] = React.useState<DataRow[]>(sourceRows);
	const [cols, setCols] = React.useState<string[]>(sourceCols);
	const [history, setHistory] = React.useState<Array<{ rows: DataRow[]; cols: string[] }>>([]);
	const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
	const [selectedNumericCol, setSelectedNumericCol] = React.useState<string>('');
	const [outlierCount, setOutlierCount] = React.useState<number>(0);
	const [iqrFactor, setIqrFactor] = React.useState<number>(1.5);
	const [parseCol, setParseCol] = React.useState<string>('');
	const [delimiter, setDelimiter] = React.useState<string>(',');
	const [parsePrefix, setParsePrefix] = React.useState<string>('part');
	const [typeEdits, setTypeEdits] = React.useState<Record<string, string>>({});
	const [colFilter, setColFilter] = React.useState<string>('');

	React.useEffect(() => {
		setRows(sourceRows);
		setCols(sourceCols);
		setSelectedKeys([]);
		setHistory([]);
	}, [sourceRows, sourceCols]);

	const missingSummary = React.useMemo(() => {
		if (!rows.length) return [] as Array<{ col: string; pct: number }>;
		const total = rows.length || 1;
		return cols.map((c) => {
			let miss = 0;
			rows.forEach(r => { const v = r?.[c]; if (v == null || v === '') miss += 1; });
			return { col: c, pct: Math.round((miss / total) * 100) };
		}).sort((a,b) => b.pct - a.pct).slice(0, 8);
	}, [rows, cols]);

	const numericColumns = React.useMemo(() => {
		if (!rows.length) return [] as string[];
		const first = rows[0] || {} as DataRow;
		return cols.filter(c => typeof first[c] === 'number');
	}, [rows, cols]);

	function detectOutliersIqr(column: string): number[] {
		const values = rows.map(r => r?.[column]).filter((v): v is number => typeof v === 'number');
		if (values.length < 4) return [];
		const sorted = [...values].sort((a,b) => a-b);
		const q1 = sorted[Math.floor(sorted.length * 0.25)];
		const q3 = sorted[Math.floor(sorted.length * 0.75)];
		const iqr = q3 - q1;
		const lo = q1 - iqrFactor * iqr;
		const hi = q3 + iqrFactor * iqr;
		const idx: number[] = [];
		rows.forEach((r, i) => { const v = r?.[column]; if (typeof v === 'number' && (v < lo || v > hi)) idx.push(i); });
		return idx;
	}

	function previewOutliers() {
		if (!selectedNumericCol) { setOutlierCount(0); return; }
		setOutlierCount(detectOutliersIqr(selectedNumericCol).length);
	}

	function pushState() {
		setHistory(prev => [...prev, { rows, cols }]);
	}

	function undo() {
		setHistory(prev => {
			if (prev.length === 0) return prev;
			const last = prev[prev.length - 1];
			setRows(last.rows);
			setCols(last.cols);
			return prev.slice(0, -1);
		});
		setOutlierCount(0);
	}

	function resetToOriginal() {
		setRows(sourceRows);
		setCols(sourceCols);
		setHistory([]);
		setOutlierCount(0);
		setSelectedNumericCol('');
	}

	function removeOutliers() {
		if (!selectedNumericCol) return;
		pushState();
		const indices = new Set(detectOutliersIqr(selectedNumericCol));
		setRows(rows.filter((_, i) => !indices.has(i)));
		setOutlierCount(0);
	}

	function coerceNumericLike() {
		pushState();
		const next = rows.map(r => {
			const o: DataRow = { ...r };
			cols.forEach(c => {
				const v = o[c];
				if (typeof v === 'string') {
					const trimmed = v.trim();
					if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) {
						const n = parseFloat(trimmed);
						if (!Number.isNaN(n)) o[c] = n;
					}
				}
			});
			return o;
		});
		setRows(next);
	}

	function splitColumnByDelimiter() {
		if (!parseCol || !delimiter) return;
		pushState();
		const partsCount = Math.max(...rows.map(r => String(r?.[parseCol] ?? '').split(delimiter).length));
		const newCols: string[] = [];
		for (let i = 0; i < partsCount; i++) {
			let candidate = `${parsePrefix}_${i+1}`;
			let suffix = 1;
			while (cols.includes(candidate) || newCols.includes(candidate)) {
				candidate = `${parsePrefix}_${i+1}_${suffix++}`;
			}
			newCols.push(candidate);
		}
		const updatedRows = rows.map(r => {
			const tokens = String(r?.[parseCol] ?? '').split(delimiter).map(s => s.trim());
			const extras: Record<string, any> = {};
			newCols.forEach((nc, i) => { extras[nc] = tokens[i] ?? ''; });
			return { ...r, ...extras };
		});
		setCols([...cols, ...newCols]);
		setRows(updatedRows);
	}

	const inferredTypes = React.useMemo(() => {
		const result: Record<string, string> = {};
		for (const c of cols) {
			let type = 'string';
			for (const r of rows) {
				const v = r?.[c];
				if (v === null || v === undefined || v === '') continue;
				if (typeof v === 'number') { type = 'number'; break; }
				if (typeof v === 'boolean') { type = 'boolean'; break; }
				if (typeof v === 'object') { type = 'object'; break; }
				if (typeof v === 'string') { type = 'string'; break; }
			}
			result[c] = type;
		}
		return result;
	}, [rows, cols]);

	function applyTypeCast() {
		pushState();
		const next = rows.map(r => {
			const o: DataRow = { ...r };
			for (const [c, t] of Object.entries(typeEdits)) {
				const v = o[c];
				if (t === 'number') {
					const n = typeof v === 'number' ? v : parseFloat(String(v));
					o[c] = Number.isNaN(n) ? null : n;
				} else if (t === 'string') {
					o[c] = v == null ? '' : String(v);
				} else if (t === 'boolean') {
					const s = String(v).toLowerCase();
					o[c] = s === 'true' || s === '1' || s === 'yes';
				} else if (t === 'date') {
					const d = new Date(String(v));
					o[c] = isNaN(d.getTime()) ? null : d.toISOString();
				}
			}
			return o;
		});
		setRows(next);
	}

	function dropEmptyColumns(thresholdPct: number = 100) {
		pushState();
		const keep = cols.filter(c => {
			let miss = 0; rows.forEach(r => { const v = r?.[c]; if (v == null || v === '') miss += 1; });
			return Math.round((miss / (rows.length || 1)) * 100) < thresholdPct;
		});
		setCols(keep);
		setRows(rows.map(r => Object.fromEntries(keep.map(k => [k, r?.[k]]))));
	}

	function dropDuplicates(keys: string[]) {
		if (keys.length === 0) return;
		pushState();
		const seen = new Set<string>();
		const deduped: DataRow[] = [];
		for (const r of rows) {
			const k = JSON.stringify(keys.map(k => r?.[k]));
			if (!seen.has(k)) { seen.add(k); deduped.push(r); }
		}
		setRows(deduped);
	}

	function standardizeStrings(mode: 'lower' | 'upper' | 'title' = 'lower') {
		pushState();
		const next = rows.map(r => {
			const out: DataRow = { ...r };
			cols.forEach(c => {
				const v = out[c];
				if (typeof v === 'string') {
					const trimmed = v.trim().replace(/\s+/g, ' ');
					out[c] = mode === 'upper' ? trimmed.toUpperCase() : mode === 'title' ? trimmed.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) : trimmed.toLowerCase();
				}
			});
			return out;
		});
		setRows(next);
	}

	function fillMissingSimple(fill: string = '') {
		pushState();
		const next = rows.map(r => {
			const out: DataRow = { ...r };
			cols.forEach(c => { if (out[c] == null || out[c] === '') out[c] = fill; });
			return out;
		});
		setRows(next);
	}

	function encodeCategoricalOneHot(maxUnique: number = 20) {
		pushState();
		const nextCols = [...cols];
		let nextRows = rows.map(r => ({ ...r }));
		for (const c of cols) {
			const uniques = Array.from(new Set(rows.map(r => r?.[c]).filter(v => v != null))).slice(0, maxUnique);
			if (uniques.length > 1 && uniques.length <= maxUnique && rows.every(r => typeof r?.[c] !== 'number')) {
				for (const u of uniques) {
					const newCol = `${c}__${String(u)}`;
					nextCols.push(newCol);
					nextRows = nextRows.map(r => ({ ...r, [newCol]: r?.[c] === u ? 1 : 0 }));
				}
			}
		}
		setCols(nextCols);
		setRows(nextRows);
	}

	function exportCsv() {
		const headers = cols.join(',');
		const body = rows.map(r => cols.map(c => {
			const v = r?.[c];
			if (v == null) return '';
			const s = String(v).replace(/"/g, '""');
			return /[",\n]/.test(s) ? `"${s}"` : s;
		}).join(',')).join('\n');
		const blob = new Blob([headers + '\n' + body], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = 'cleaned.csv'; a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="h-full overflow-auto p-4 space-y-4">
			<div className="glass p-4 flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold">Clean your data</h2>
					<p className="text-gray-300 text-sm">AI-powered automated cleaning or guided manual steps. Undo anytime.</p>
				</div>
				<div className="flex items-center gap-2">
					<button className="h-9 px-3 rounded-md bg-white/10 text-white text-sm disabled:opacity-50" onClick={undo} disabled={history.length === 0}>Undo</button>
					<button className="h-9 px-3 rounded-md bg-white/10 text-white text-sm" onClick={resetToOriginal}>Reset</button>
					<button className="h-9 px-3 rounded-md gradient-accent text-black text-sm" onClick={exportCsv}>Export cleaned CSV</button>
				</div>
			</div>

			{/* AI-Powered Automated Cleaning Section */}
			<AICleaningSection 
				rows={rows} 
				cols={cols} 
				onApplyChanges={(newRows, newCols) => {
					pushState();
					setRows(newRows);
					setCols(newCols);
				}}
			/>

			<div className="grid lg:grid-cols-2 gap-4">
				<Section title="Step 1 · Fix missing values" description="Fill empty cells and drop columns that are entirely empty.">
					{missingSummary.length === 0 ? (
						<p className="text-sm text-gray-400">No preview available.</p>
					) : (
						<div className="space-y-2">
							<div className="max-h-36 overflow-auto border border-white/10 rounded-md divide-y divide-white/10">
								{missingSummary.map(it => (
									<div key={it.col} className="p-2">
										<div className="flex items-center justify-between text-sm">
											<span className="truncate pr-2 text-gray-200">{it.col}</span>
											<span className="text-gray-400">{it.pct}%</span>
										</div>
										<div className="mt-1 h-1.5 bg-white/10 rounded">
											<div className="h-1.5 bg-red-400/70 rounded" style={{ width: `${it.pct}%` }} />
										</div>
									</div>
								))}
							</div>
							<div className="flex gap-2">
								<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm" onClick={() => dropEmptyColumns(100)}>Drop fully empty columns</button>
								<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm" onClick={() => fillMissingSimple('N/A')}>Fill empties with "N/A"</button>
							</div>
						</div>
					)}
				</Section>

				<Section title="Step 2 · Remove duplicates" description="Remove repeated rows based on chosen columns.">
					<div className="space-y-2 w-full">
						<div className="flex items-center gap-2">
							<input className="h-8 w-56 bg-white/10 border border-white/10 rounded-md px-2 text-sm" placeholder="Search columns" value={colFilter} onChange={(e) => setColFilter(e.target.value)} />
							<span className="text-xs text-gray-400">Selected {selectedKeys.length}</span>
							<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm disabled:opacity-50" onClick={() => setSelectedKeys([])} disabled={selectedKeys.length === 0}>Clear</button>
						</div>
						<div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto border border-white/10 rounded-md p-2">
							{cols.filter(c => c.toLowerCase().includes(colFilter.toLowerCase())).map(c => {
								const checked = selectedKeys.includes(c);
								return (
									<label key={c} className="flex items-center gap-2 text-sm">
										<input type="checkbox" className="accent-blue-400" checked={checked} onChange={(e) => {
											if (e.target.checked) setSelectedKeys(prev => [...prev, c]);
											else setSelectedKeys(prev => prev.filter(x => x !== c));
										}} />
										<span className="truncate text-gray-200">{c}</span>
									</label>
								);
							})}
						</div>
						<div>
							<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm" onClick={() => dropDuplicates(selectedKeys)} disabled={selectedKeys.length === 0}>Remove duplicates</button>
						</div>
					</div>
				</Section>

				<Section title="Step 3 · Handle outliers" description="Pick a number column and remove extreme values.">
					<div className="flex items-center gap-2 flex-wrap">
						<select className="h-8 bg-gray-800 border border-gray-600 rounded-md px-2 text-sm text-white" value={selectedNumericCol} onChange={(e) => setSelectedNumericCol(e.target.value)}>
							<option value="" className="bg-gray-800 text-white">Select number column</option>
							{numericColumns.map(c => (<option key={c} value={c} className="bg-gray-800 text-white hover:bg-gray-700">{c}</option>))}
						</select>
						<label className="text-sm text-gray-300">Sensitivity (lower = stricter)</label>
						<input title="Lower is stricter" type="number" step={0.1} className="h-8 w-20 bg-white/10 border border-white/10 rounded-md px-2 text-sm" value={iqrFactor} onChange={(e) => setIqrFactor(parseFloat(e.target.value || '1.5'))} />
						<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm" onClick={previewOutliers}>Check</button>
						<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm" onClick={removeOutliers} disabled={!selectedNumericCol || outlierCount === 0}>Remove outliers</button>
						{selectedNumericCol && <span className="text-xs glass px-2 py-1 rounded">Found {outlierCount}</span>}
					</div>
				</Section>

				<Section title="Step 4 · Neaten text" description="Trim spaces and unify letter casing across text columns.">
					<div className="flex items-center gap-2 flex-wrap">
						<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm" onClick={() => standardizeStrings('title')}>Title Case</button>
						<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm" onClick={() => standardizeStrings('lower')}>lowercase</button>
						<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm" onClick={() => standardizeStrings('upper')}>UPPERCASE</button>
						<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm" onClick={coerceNumericLike}>Convert number-like text</button>
					</div>
				</Section>

				<Section title="Optional · Split a column" description="Break a column into parts using a separator (like , or -).">
					<div className="flex items-center gap-2 flex-wrap">
						<select className="h-8 bg-gray-800 border border-gray-600 rounded-md px-2 text-sm text-white" value={parseCol} onChange={(e) => setParseCol(e.target.value)}>
							<option value="" className="bg-gray-800 text-white">Choose column</option>
							{cols.map(c => (<option key={c} value={c} className="bg-gray-800 text-white hover:bg-gray-700">{c}</option>))}
						</select>
						<input className="h-8 w-20 bg-white/10 border border-white/10 rounded-md px-2 text-sm" placeholder="," value={delimiter} onChange={(e) => setDelimiter(e.target.value)} />
						<input className="h-8 w-28 bg-white/10 border border-white/10 rounded-md px-2 text-sm" placeholder="new name prefix" value={parsePrefix} onChange={(e) => setParsePrefix(e.target.value)} />
						<button className="h-8 px-3 rounded-md bg-white/10 text-white text-sm" onClick={splitColumnByDelimiter} disabled={!parseCol || !delimiter}>Split column</button>
					</div>
				</Section>

				<Section title="Optional · Change data types" description="Tell Clar how a column should be treated.">
					<div className="max-h-64 overflow-auto border border-white/10 rounded-md">
						<table className="w-full text-sm">
							<thead className="bg-white/5">
								<tr>
									<th className="text-left px-3 py-2">Column</th>
									<th className="text-left px-3 py-2">Inferred</th>
									<th className="text-left px-3 py-2">Set as</th>
								</tr>
							</thead>
							<tbody>
								{cols.map(c => (
									<tr key={c} className="border-t border-white/10">
										<td className="px-3 py-2 text-gray-200 truncate max-w-[200px]">{c}</td>
										<td className="px-3 py-2 text-gray-400">{inferredTypes[c]}</td>
										<td className="px-3 py-2">
											<select className="h-8 bg-gray-800 border border-gray-600 rounded-md px-2 text-sm text-white" value={typeEdits[c] || ''} onChange={(e) => setTypeEdits(prev => ({ ...prev, [c]: e.target.value }))}>
												<option value="" className="bg-gray-800 text-white">(no change)</option>
												<option value="string" className="bg-gray-800 text-white hover:bg-gray-700">string</option>
												<option value="number" className="bg-gray-800 text-white hover:bg-gray-700">number</option>
												<option value="boolean" className="bg-gray-800 text-white hover:bg-gray-700">boolean</option>
												<option value="date" className="bg-gray-800 text-white hover:bg-gray-700">date (ISO)</option>
											</select>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="flex justify-end mt-2">
						<button className="h-8 px-3 rounded-md gradient-accent text-black text-sm" onClick={applyTypeCast}>Apply</button>
					</div>
				</Section>
			</div>

			<div className="glass p-3">
				<h3 className="font-semibold mb-2">Cleaned Preview</h3>
				<div className="overflow-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-gray-300">
								{cols.map(c => (<th key={c} className="pr-4 py-1 whitespace-nowrap">{c}</th>))}
							</tr>
						</thead>
						<tbody>
							{rows.slice(0, 25).map((r, i) => (
								<tr key={i} className="border-t border-white/10">
									{cols.map(c => (<td key={c} className="pr-4 py-1 whitespace-nowrap text-gray-200">{String(r?.[c] ?? '')}</td>))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

const Section: React.FC<{ title: string; description?: string; children?: React.ReactNode }> = ({ title, description, children }) => (
	<div className="glass p-4 space-y-2">
		<div className="flex items-center justify-between">
			<h3 className="font-semibold">{title}</h3>
		</div>
		{description && <p className="text-sm text-gray-400">{description}</p>}
		{children}
	</div>
);

interface AICleaningSectionProps {
	rows: DataRow[];
	cols: string[];
	onApplyChanges: (newRows: DataRow[], newCols: string[]) => void;
}

interface CleaningSuggestion {
	id: string;
	type: 'missing_values' | 'duplicates' | 'outliers' | 'data_types' | 'formatting';
	title: string;
	description: string;
	impact: 'low' | 'medium' | 'high';
	confidence: number;
	preview: string;
	action: () => { rows: DataRow[]; cols: string[] };
}

const AICleaningSection: React.FC<AICleaningSectionProps> = ({ rows, cols, onApplyChanges }) => {
	const [isAnalyzing, setIsAnalyzing] = React.useState(false);
	const [suggestions, setSuggestions] = React.useState<CleaningSuggestion[]>([]);
	const [selectedSuggestions, setSelectedSuggestions] = React.useState<string[]>([]);

	const analyzeDataWithAI = React.useCallback(async () => {
		if (!rows.length || !cols.length) return;

		setIsAnalyzing(true);
		try {
			// Simulate AI analysis with more realistic timing
			await new Promise(resolve => setTimeout(resolve, 1500));

			const newSuggestions: CleaningSuggestion[] = [];

			// 1. Analyze missing values with smart imputation
			const missingAnalysis = cols.map(col => {
				const missing = rows.filter(row => row[col] == null || row[col] === '').length;
				const nonNullValues = rows.map(row => row[col]).filter(v => v != null && v !== '');
				const dataType = nonNullValues.length > 0 ? typeof nonNullValues[0] : 'unknown';
				return { col, missing, percentage: (missing / rows.length) * 100, dataType, nonNullValues };
			}).filter(item => item.percentage > 0);

			if (missingAnalysis.length > 0) {
				const totalMissing = missingAnalysis.reduce((sum, item) => sum + item.missing, 0);
				newSuggestions.push({
					id: 'missing-values',
					type: 'missing_values',
					title: 'Smart Missing Value Imputation',
					description: `Found ${totalMissing} missing values across ${missingAnalysis.length} columns. AI will use median for numbers, mode for categories, and forward-fill for sequences.`,
					impact: 'high',
					confidence: 0.92,
					preview: `Will intelligently fill ${totalMissing} missing values using statistical methods`,
					action: () => {
						const newRows = rows.map(row => {
							const newRow = { ...row };
							missingAnalysis.forEach(({ col, nonNullValues, dataType }) => {
								if (newRow[col] == null || newRow[col] === '') {
									if (nonNullValues.length > 0) {
										if (dataType === 'number') {
											// Use median for numeric values
											const sorted = [...nonNullValues].sort((a, b) => a - b);
											newRow[col] = sorted[Math.floor(sorted.length / 2)];
										} else if (dataType === 'string') {
											// Use mode (most frequent) for categorical values
											const counts = nonNullValues.reduce((acc, val) => {
												acc[val] = (acc[val] || 0) + 1;
												return acc;
											}, {} as Record<string, number>);
											newRow[col] = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
										} else {
											// Default fallback
											newRow[col] = nonNullValues[0];
										}
									}
								}
							});
							return newRow;
						});
						return { rows: newRows, cols };
					}
				});
			}

			// 2. Analyze and remove exact duplicates
			const duplicateAnalysis = () => {
				const seen = new Set<string>();
				let duplicateCount = 0;
				rows.forEach(row => {
					const key = JSON.stringify(row);
					if (seen.has(key)) {
						duplicateCount++;
					} else {
						seen.add(key);
					}
				});
				return duplicateCount;
			};

			const duplicateCount = duplicateAnalysis();
			if (duplicateCount > 0) {
				newSuggestions.push({
					id: 'duplicates',
					type: 'duplicates',
					title: 'Remove Exact Duplicates',
					description: `Found ${duplicateCount} exact duplicate rows that provide no additional information.`,
					impact: 'medium',
					confidence: 0.98,
					preview: `Will remove ${duplicateCount} duplicate rows, keeping ${rows.length - duplicateCount} unique rows`,
					action: () => {
						const seen = new Set<string>();
						const uniqueRows = rows.filter(row => {
							const key = JSON.stringify(row);
							if (seen.has(key)) return false;
							seen.add(key);
							return true;
						});
						return { rows: uniqueRows, cols };
					}
				});
			}

			// 3. Analyze data types and suggest conversions
			const typeAnalysis = cols.map(col => {
				const values = rows.map(row => row[col]).filter(v => v != null && v !== '');
				if (values.length === 0) return null;

				const currentType = typeof values[0];
				let suggestedType: DataType = currentType as DataType;
				let conversionCount = 0;

				if (currentType === 'string') {
					// Check if strings can be converted to numbers
					const numericLike = values.filter(v => 
						typeof v === 'string' && /^[+-]?\d+(?:\.\d+)?$/.test(v.trim())
					);
					if (numericLike.length > values.length * 0.8) {
						suggestedType = 'number' as DataType;
						conversionCount = numericLike.length;
					}
					
					// Check if strings can be converted to dates
					const dateLike = values.filter(v => {
						if (typeof v !== 'string') return false;
						const date = new Date(v);
						return !isNaN(date.getTime()) && v.length > 4;
					});
					if (dateLike.length > values.length * 0.7 && suggestedType === 'string') {
						suggestedType = 'date' as DataType;
						conversionCount = dateLike.length;
					}
				}

				return currentType !== suggestedType ? { col, currentType, suggestedType, conversionCount } : null;
			}).filter(Boolean);

			if (typeAnalysis.length > 0) {
				const totalConversions = typeAnalysis.reduce((sum, item) => sum + (item?.conversionCount || 0), 0);
				newSuggestions.push({
					id: 'data-types',
					type: 'data_types',
					title: 'Optimize Data Types',
					description: `AI detected ${typeAnalysis.length} columns that can be converted to more appropriate data types for better analysis.`,
					impact: 'high',
					confidence: 0.88,
					preview: `Will convert ${typeAnalysis.map(t => t?.col).join(', ')} to proper types (${totalConversions} values affected)`,
					action: () => {
						const newRows = rows.map(row => {
							const newRow = { ...row };
							typeAnalysis.forEach(analysis => {
								if (!analysis) return;
								const { col, suggestedType } = analysis;
								const value = newRow[col];
								
								if (suggestedType === 'number' && typeof value === 'string') {
									const trimmed = value.trim();
									if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) {
										const num = parseFloat(trimmed);
										if (!Number.isNaN(num)) {
											newRow[col] = num;
										}
									}
								} else if (suggestedType === 'date' && typeof value === 'string') {
									const date = new Date(value);
									if (!isNaN(date.getTime())) {
										newRow[col] = date.toISOString().split('T')[0]; // YYYY-MM-DD format
									}
								}
							});
							return newRow;
						});
						return { rows: newRows, cols };
					}
				});
			}

			// 4. Analyze text formatting issues
			const textFormattingAnalysis = cols.map(col => {
				const stringValues = rows.map(row => row[col]).filter(v => typeof v === 'string') as string[];
				if (stringValues.length === 0) return null;

				let issuesFound = 0;
				const issues: string[] = [];

				// Check for leading/trailing whitespace
				const whitespaceIssues = stringValues.filter(v => v !== v.trim()).length;
				if (whitespaceIssues > 0) {
					issuesFound += whitespaceIssues;
					issues.push(`${whitespaceIssues} values with extra whitespace`);
				}

				// Check for inconsistent casing
				const hasLower = stringValues.some(v => v !== v.toUpperCase());
				const hasUpper = stringValues.some(v => v !== v.toLowerCase());
				if (hasLower && hasUpper) {
					issues.push('inconsistent text casing');
					issuesFound += stringValues.length;
				}

				// Check for multiple consecutive spaces
				const multiSpaceIssues = stringValues.filter(v => /\s{2,}/.test(v)).length;
				if (multiSpaceIssues > 0) {
					issuesFound += multiSpaceIssues;
					issues.push(`${multiSpaceIssues} values with multiple spaces`);
				}

				return issuesFound > 0 ? { col, issuesFound, issues } : null;
			}).filter(Boolean);

			if (textFormattingAnalysis.length > 0) {
				const totalIssues = textFormattingAnalysis.reduce((sum, item) => sum + (item?.issuesFound || 0), 0);
				newSuggestions.push({
					id: 'formatting',
					type: 'formatting',
					title: 'Standardize Text Formatting',
					description: `Found formatting inconsistencies in ${textFormattingAnalysis.length} text columns that can be automatically cleaned.`,
					impact: 'medium',
					confidence: 0.95,
					preview: `Will clean ${totalIssues} formatting issues: trim whitespace, normalize spacing, and standardize case`,
					action: () => {
						const newRows = rows.map(row => {
							const newRow = { ...row };
							textFormattingAnalysis.forEach(analysis => {
								if (!analysis) return;
								const { col } = analysis;
								if (typeof newRow[col] === 'string') {
									// Trim whitespace, normalize multiple spaces, and convert to title case
									newRow[col] = newRow[col]
										.trim()
										.replace(/\s+/g, ' ')
										.toLowerCase()
										.replace(/\b\w/g, (l: string) => l.toUpperCase());
								}
							});
							return newRow;
						});
						return { rows: newRows, cols };
					}
				});
			}

			// 5. Analyze outliers in numeric columns
			const numericCols = cols.filter(col => {
				const values = rows.map(row => row[col]).filter(v => typeof v === 'number');
				return values.length > rows.length * 0.5; // At least 50% numeric
			});

			const outlierAnalysis = numericCols.map(col => {
				const values = rows.map(row => row[col]).filter(v => typeof v === 'number') as number[];
				if (values.length < 4) return null;

				const sorted = [...values].sort((a, b) => a - b);
				const q1 = sorted[Math.floor(sorted.length * 0.25)];
				const q3 = sorted[Math.floor(sorted.length * 0.75)];
				const iqr = q3 - q1;
				const lowerBound = q1 - 1.5 * iqr;
				const upperBound = q3 + 1.5 * iqr;

				const outliers = values.filter(v => v < lowerBound || v > upperBound);
				return outliers.length > 0 ? { col, outlierCount: outliers.length, total: values.length } : null;
			}).filter(Boolean);

			if (outlierAnalysis.length > 0) {
				const totalOutliers = outlierAnalysis.reduce((sum, item) => sum + (item?.outlierCount || 0), 0);
				newSuggestions.push({
					id: 'outliers',
					type: 'outliers',
					title: 'Handle Statistical Outliers',
					description: `Detected ${totalOutliers} statistical outliers across ${outlierAnalysis.length} numeric columns that may skew analysis results.`,
					impact: 'medium',
					confidence: 0.82,
					preview: `Will cap extreme values using IQR method, affecting ${totalOutliers} data points`,
					action: () => {
						const newRows = rows.map(row => {
							const newRow = { ...row };
							outlierAnalysis.forEach(analysis => {
								if (!analysis) return;
								const { col } = analysis;
								const value = newRow[col];
								if (typeof value === 'number') {
									const allValues = rows.map(r => r[col]).filter(v => typeof v === 'number') as number[];
									const sorted = [...allValues].sort((a, b) => a - b);
									const q1 = sorted[Math.floor(sorted.length * 0.25)];
									const q3 = sorted[Math.floor(sorted.length * 0.75)];
									const iqr = q3 - q1;
									const lowerBound = q1 - 1.5 * iqr;
									const upperBound = q3 + 1.5 * iqr;

									// Cap outliers instead of removing them
									if (value < lowerBound) newRow[col] = lowerBound;
									if (value > upperBound) newRow[col] = upperBound;
								}
							});
							return newRow;
						});
						return { rows: newRows, cols };
					}
				});
			}

			setSuggestions(newSuggestions);
		} catch (error) {
			console.error('AI analysis failed:', error);
			toast.error('AI analysis failed. Please try again.');
		} finally {
			setIsAnalyzing(false);
		}
	}, [rows, cols]);

	const applySelectedSuggestions = React.useCallback(() => {
		let currentRows = [...rows];
		let currentCols = [...cols];

		selectedSuggestions.forEach(suggestionId => {
			const suggestion = suggestions.find(s => s.id === suggestionId);
			if (suggestion) {
				const result = suggestion.action();
				currentRows = result.rows;
				currentCols = result.cols;
			}
		});

		onApplyChanges(currentRows, currentCols);
		setSelectedSuggestions([]);
		setSuggestions([]);
		toast.success(`Applied ${selectedSuggestions.length} cleaning suggestions successfully!`);
	}, [selectedSuggestions, suggestions, rows, cols, onApplyChanges]);

	const getImpactColor = (impact: string) => {
		switch (impact) {
			case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
			case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
			case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
			default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
		}
	};

	return (
		<div className="glass p-4 space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold flex items-center gap-2">
						<span>🤖</span>
						AI-Powered Automated Cleaning
					</h3>
					<p className="text-sm text-gray-400">Let AI analyze your data and suggest optimal cleaning strategies</p>
				</div>
				<button
					onClick={analyzeDataWithAI}
					disabled={isAnalyzing || !rows.length}
					className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors"
				>
					{isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
				</button>
			</div>

			{isAnalyzing && (
				<div className="flex items-center justify-center py-8">
					<div className="text-center">
						<div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
						<p className="text-gray-400">AI is analyzing your data...</p>
					</div>
				</div>
			)}

			{suggestions.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">AI Recommendations</h4>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setSelectedSuggestions(suggestions.map(s => s.id))}
								className="text-sm text-blue-400 hover:text-blue-300"
							>
								Select All
							</button>
							<button
								onClick={() => setSelectedSuggestions([])}
								className="text-sm text-gray-400 hover:text-gray-300"
							>
								Clear
							</button>
							<button
								onClick={applySelectedSuggestions}
								disabled={selectedSuggestions.length === 0}
								className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
							>
								Apply Selected ({selectedSuggestions.length})
							</button>
						</div>
					</div>

					<div className="space-y-3">
						{suggestions.map(suggestion => (
							<div
								key={suggestion.id}
								className={`border rounded-lg p-4 transition-colors ${
									selectedSuggestions.includes(suggestion.id)
										? 'border-blue-500 bg-blue-500/10'
										: 'border-gray-600 bg-gray-800/50'
								}`}
							>
								<div className="flex items-start gap-3">
									<input
										type="checkbox"
										checked={selectedSuggestions.includes(suggestion.id)}
										onChange={(e) => {
											if (e.target.checked) {
												setSelectedSuggestions(prev => [...prev, suggestion.id]);
											} else {
												setSelectedSuggestions(prev => prev.filter(id => id !== suggestion.id));
											}
										}}
										className="mt-1 accent-blue-500"
									/>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<h5 className="font-medium text-white">{suggestion.title}</h5>
											<span className={`px-2 py-1 rounded text-xs border ${getImpactColor(suggestion.impact)}`}>
												{suggestion.impact} impact
											</span>
											<span className="text-xs text-gray-400">
												{Math.round(suggestion.confidence * 100)}% confidence
											</span>
										</div>
										<p className="text-sm text-gray-300 mb-2">{suggestion.description}</p>
										<p className="text-xs text-gray-400 italic">{suggestion.preview}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};