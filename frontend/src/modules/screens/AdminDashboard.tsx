import React, { useState, useEffect } from 'react';
import { useDatasets } from '../state/DatasetsContext';
import { useAuth } from '../state/AuthContext';
import { 
    CircleStackIcon, TableCellsIcon, SparklesIcon, CommandLineIcon,
    ArrowPathIcon, EyeIcon, WrenchScrewdriverIcon, ChartBarIcon,
    ShieldCheckIcon, CheckCircleIcon, CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface DBStatus {
    connected: boolean;
    type: string;
    host: string;
    database: string;
    total_tables: number;
    tables: Array<{
        name: string;
        columns: Array<{ name: string; type: string }>;
    }>;
}

interface QueryResult {
    success: boolean;
    columns?: string[];
    data?: any[];
    row_count?: number;
    message?: string;
    error?: string;
}

import { API_BASE } from '../services/api';

export const AdminDashboard: React.FC<{ onNavigate?: (tab: string, datasetId?: string) => void }> = ({ onNavigate }) => {
    const { user } = useAuth();
    const { datasets, selectedDatasetId, selectDataset } = useDatasets();
    const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
    const [sqlQuery, setSqlQuery] = useState('SELECT name, row_count, file_type, updated_at FROM clarivo_datasets');
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
    const [isExecutingSql, setIsExecutingSql] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchDbStatus = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch(`${API_BASE}/database/status`);
            if (res.ok) {
                const data = await res.json();
                setDbStatus(data);
            }
        } catch (err) {
            console.error('Error fetching DB status:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDbStatus();
    }, []);

    const handleRunSql = async () => {
        if (!sqlQuery.trim()) return;
        setIsExecutingSql(true);
        try {
            const res = await fetch(`${API_BASE}/database/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: sqlQuery, limit: 100 })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setQueryResult(data);
                toast.success(`Query returned ${data.row_count || 0} rows`);
            } else {
                setQueryResult({ success: false, error: data.detail || data.error || 'Query failed' });
                toast.error(data.detail || data.error || 'Query error');
            }
        } catch (err: any) {
            setQueryResult({ success: false, error: err.message });
            toast.error('Failed to execute SQL query');
        } finally {
            setIsExecutingSql(false);
        }
    };

    const handleSyncDb = async () => {
        toast.loading('Syncing datasets to PostgreSQL...', { id: 'db-sync' });
        try {
            const res = await fetch(`${API_BASE}/database/sync`, { method: 'POST' });
            if (res.ok) {
                toast.success('Database and datasets successfully synced!', { id: 'db-sync' });
                fetchDbStatus();
            } else {
                toast.error('Sync failed', { id: 'db-sync' });
            }
        } catch {
            toast.error('Sync request failed', { id: 'db-sync' });
        }
    };

    const totalRows = datasets.reduce((acc, d) => acc + (d.rows || 0), 0);

    return (
        <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto max-w-7xl mx-auto">
            {/* Admin Header Banner */}
            <div className="glass rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-r from-slate-900/90 via-purple-950/20 to-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                            ADMIN CONSOLE
                        </span>
                        <span className="text-xs text-slate-400">Platform Control & SQL Terminal</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100">Welcome, {user?.fullName}</h1>
                    <p className="text-sm text-slate-400">Monitoring {datasets.length} managed datasets and Neon PostgreSQL cluster.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onNavigate && onNavigate('database')}
                        className="px-4 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg hover:scale-105"
                    >
                        <CircleStackIcon className="w-3.5 h-3.5" />
                        <span>Database Explorer</span>
                    </button>
                    <button
                        onClick={handleSyncDb}
                        className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg hover:scale-105"
                    >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                        <span>Sync PostgreSQL</span>
                    </button>
                    <button
                        onClick={() => onNavigate && onNavigate('home')}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg hover:scale-105"
                    >
                        <CloudArrowUpIcon className="w-4 h-4" />
                        <span>Upload Dataset</span>
                    </button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass rounded-2xl p-5 border border-white/5 bg-slate-900/50">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                        <span>MANAGED DATASETS</span>
                        <TableCellsIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-3xl font-bold text-slate-100">{datasets.length}</div>
                    <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>All indexed in database</span>
                    </div>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5 bg-slate-900/50">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                        <span>TOTAL DATA ROWS</span>
                        <CircleStackIcon className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-purple-300">{totalRows.toLocaleString()}</div>
                    <div className="text-xs text-slate-400 mt-2">Active records across tables</div>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5 bg-slate-900/50">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                        <span>NEON POSTGRESQL</span>
                        <CircleStackIcon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold text-emerald-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{dbStatus?.connected ? 'ONLINE' : 'CONNECTING'}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 truncate">
                        {dbStatus?.host ? dbStatus.host.split('.')[0] : 'AWS Neon Tech'}
                    </div>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5 bg-slate-900/50">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                        <span>AI REASONING CORE</span>
                        <SparklesIcon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-amber-300">Gemini 2.5 Flash</div>
                    <div className="text-xs text-slate-400 mt-2">Ready for automated insights</div>
                </div>
            </div>

            {/* Live Interactive SQL Terminal */}
            <div className="glass rounded-3xl p-6 border border-white/10 bg-slate-900/60 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CommandLineIcon className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-base font-semibold text-slate-100">Live PostgreSQL SQL Query Terminal</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSqlQuery('SELECT name, row_count, file_type, updated_at FROM clarivo_datasets')}
                            className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5"
                        >
                            Datasets Meta
                        </button>
                        <button
                            onClick={() => setSqlQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")}
                            className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5"
                        >
                            List Tables
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        rows={3}
                        placeholder="Write SQL query (e.g. SELECT * FROM clarivo_datasets LIMIT 10;)"
                        className="w-full p-3 font-mono text-xs bg-slate-950 border border-cyan-500/20 rounded-xl text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/60 transition-all resize-none"
                    />
                    <button
                        onClick={handleRunSql}
                        disabled={isExecutingSql}
                        className="absolute bottom-3 right-3 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1 shadow-lg transition-all"
                    >
                        {isExecutingSql ? 'Running...' : 'Execute SQL'}
                    </button>
                </div>

                {/* SQL Query Results Table */}
                {queryResult && (
                    <div className="mt-2">
                        {queryResult.success && queryResult.data ? (
                            <div className="rounded-xl border border-white/10 overflow-hidden max-h-64 overflow-y-auto">
                                <table className="w-full text-left text-xs font-mono">
                                    <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-white/10">
                                        <tr>
                                            {queryResult.columns?.map((col) => (
                                                <th key={col} className="p-2.5 font-medium">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 bg-slate-900/80">
                                        {queryResult.data.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-cyan-500/5 transition-colors">
                                                {queryResult.columns?.map((col) => (
                                                    <td key={col} className="p-2.5 text-slate-300 truncate max-w-xs">
                                                        {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? 'NULL')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono">
                                Error: {queryResult.error || 'Unknown query error'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Datasets Management Table */}
            <div className="glass rounded-3xl p-6 border border-white/10 bg-slate-900/60 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-100">Dataset Registry</h2>
                    <span className="text-xs text-slate-400">{datasets.length} datasets active</span>
                </div>

                <div className="divide-y divide-white/5">
                    {datasets.map((ds) => (
                        <div key={ds.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/[0.02] p-2 rounded-xl transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    <TableCellsIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-200">{ds.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                        <span>{(ds.rows || 0).toLocaleString()} rows</span>
                                        <span>•</span>
                                        <span>{ds.columns || 0} columns</span>
                                        <span>•</span>
                                        <span className="uppercase text-purple-400 font-mono text-[10px]">{ds.name.split('.').pop() || 'CSV'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                                <button
                                    onClick={() => {
                                        selectDataset(ds.id);
                                        onNavigate && onNavigate('view', ds.id);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all"
                                    title="View & Filter Dataset"
                                >
                                    <EyeIcon className="w-3.5 h-3.5" />
                                    <span>View</span>
                                </button>
                                <button
                                    onClick={() => {
                                        selectDataset(ds.id);
                                        onNavigate && onNavigate('cleaning', ds.id);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium flex items-center gap-1 transition-all"
                                    title="Auto Data Cleaning"
                                >
                                    <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                                    <span>Clean</span>
                                </button>
                                <button
                                    onClick={() => {
                                        selectDataset(ds.id);
                                        onNavigate && onNavigate('visualize', ds.id);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1 transition-all"
                                    title="Open Visualizer"
                                >
                                    <ChartBarIcon className="w-3.5 h-3.5" />
                                    <span>Visualize</span>
                                </button>
                                <button
                                    onClick={() => {
                                        selectDataset(ds.id);
                                        onNavigate && onNavigate('ai-auto', ds.id);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center gap-1 transition-all"
                                    title="Run AI Auto Analysis"
                                >
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    <span>AI Auto</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
