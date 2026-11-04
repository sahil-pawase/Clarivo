import React, { useState, useEffect } from 'react';
import { 
    CircleStackIcon, TableCellsIcon, CommandLineIcon, ArrowPathIcon, 
    CheckCircleIcon, XCircleIcon, ArrowDownTrayIcon, PlayIcon, 
    DocumentDuplicateIcon, SparklesIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { API_BASE, generateSqlFromText } from '../services/api';
import { useDatasets } from '../state/DatasetsContext';

interface TableColumn {
    name: string;
    type: string;
}

interface TableInfo {
    name: string;
    columns: TableColumn[];
    row_count?: number;
}

interface DBStatus {
    connected: boolean;
    type: string;
    host: string;
    database: string;
    total_tables: number;
    tables: TableInfo[];
    error?: string;
}

interface QueryResult {
    success: boolean;
    columns?: string[];
    data?: any[];
    row_count?: number;
    message?: string;
    error?: string;
}

export const DatabaseScreen: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
    const { refresh: refreshDatasets } = useDatasets();
    const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM clarivo_datasets LIMIT 10;');
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingSql, setIsGeneratingSql] = useState(false);
    const [sqlAiExplanation, setSqlAiExplanation] = useState<string | null>(null);

    const handleGenerateAiSql = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!aiPrompt.trim()) {
            toast.error('Enter a plain-English question for AI SQL Copilot');
            return;
        }
        setIsGeneratingSql(true);
        setSqlAiExplanation(null);
        try {
            const res = await generateSqlFromText(aiPrompt.trim(), selectedTable || undefined);
            if (res && res.sql) {
                setSqlQuery(res.sql);
                setSqlAiExplanation(`${res.explanation || 'Query generated'} (Confidence: ${Math.round((res.confidence || 0.9) * 100)}%)`);
                toast.success('SQL query generated! Click Run Query to execute.');
            } else {
                toast.error('Could not translate question to SQL');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'AI SQL generation failed');
        } finally {
            setIsGeneratingSql(false);
        }
    };

    const fetchDatabaseStatus = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/database/status`);
            if (res.ok) {
                const data = await res.json();
                setDbStatus(data);
                if (data.tables && data.tables.length > 0 && !selectedTable) {
                    setSelectedTable(data.tables[0].name);
                }
            } else {
                setDbStatus({
                    connected: false,
                    type: 'postgresql',
                    host: 'neon.tech',
                    database: 'clarivo',
                    total_tables: 0,
                    tables: [],
                    error: `HTTP ${res.status}: Failed to reach database endpoint`
                });
            }
        } catch (err: any) {
            console.error('Error fetching database status:', err);
            setDbStatus({
                connected: false,
                type: 'postgresql',
                host: 'neon.tech',
                database: 'clarivo',
                total_tables: 0,
                tables: [],
                error: err.message || 'Connection failed'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDatabaseStatus();
    }, []);

    const handleRunQuery = async (queryToRun?: string) => {
        const query = queryToRun || sqlQuery;
        if (!query.trim()) {
            toast.error('Please enter a SQL query');
            return;
        }

        setIsExecuting(true);
        try {
            const res = await fetch(`${API_BASE}/database/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim(), limit: 200 })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setQueryResult(data);
                toast.success(`Query returned ${data.row_count || 0} rows`);
            } else {
                setQueryResult({ success: false, error: data.detail || data.error || 'Query failed' });
                toast.error(data.detail || data.error || 'SQL execution error');
            }
        } catch (err: any) {
            setQueryResult({ success: false, error: err.message });
            toast.error('Failed to execute query');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleSyncDatabase = async () => {
        setIsSyncing(true);
        toast.loading('Syncing datasets with Neon PostgreSQL...', { id: 'db-sync' });
        try {
            const res = await fetch(`${API_BASE}/database/sync`, { method: 'POST' });
            if (res.ok) {
                toast.success('All datasets successfully synchronized to PostgreSQL!', { id: 'db-sync' });
                fetchDatabaseStatus();
                refreshDatasets();
            } else {
                toast.error('Sync failed', { id: 'db-sync' });
            }
        } catch {
            toast.error('Sync request failed', { id: 'db-sync' });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSelectTable = (tableName: string) => {
        setSelectedTable(tableName);
        const query = `SELECT * FROM "${tableName}" LIMIT 20;`;
        setSqlQuery(query);
        handleRunQuery(query);
    };

    const exportQueryResult = () => {
        if (!queryResult || !queryResult.data || queryResult.data.length === 0) {
            toast.error('No query data to export');
            return;
        }

        const safeData = queryResult.data;
        const cols = queryResult.columns || Object.keys(safeData[0] || {});
        const csvContent = [
            cols.join(','),
            ...safeData.map(row => 
                cols.map(c => `"${String(row[c] ?? '').replace(/"/g, '""')}"`).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query_result_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Query result exported as CSV');
    };

    const filteredTables = (dbStatus?.tables || []).filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeTableInfo = (dbStatus?.tables || []).find(t => t.name === selectedTable);

    return (
        <div className="h-full flex flex-col gap-5 p-6 overflow-y-auto max-w-7xl mx-auto">
            {/* Header Status Card */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 font-mono">
                                <CircleStackIcon className="w-3.5 h-3.5" />
                                NEON POSTGRESQL
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                                dbStatus?.connected 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                                {dbStatus?.connected ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        ONLINE & CONNECTED
                                    </>
                                ) : (
                                    <>
                                        <XCircleIcon className="w-3.5 h-3.5" />
                                        DISCONNECTED
                                    </>
                                )}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Database & SQL Explorer</h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Serverless PostgreSQL cluster host: <span className="font-mono text-slate-200">{dbStatus?.host || 'ep-odd-sound-a1v7s43f.ap-southeast-1.aws.neon.tech'}</span> • Database: <span className="font-mono text-cyan-300">{dbStatus?.database || 'neondb'}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={fetchDatabaseStatus}
                            disabled={isLoading}
                            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>

                        <button
                            onClick={handleSyncDatabase}
                            disabled={isSyncing}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg hover:scale-105"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? 'Syncing...' : 'Sync Datasets to Cloud'}</span>
                        </button>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Tables</div>
                        <div className="text-xl font-bold text-cyan-400 mt-1">{dbStatus?.total_tables ?? (dbStatus?.tables?.length || 0)}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Database Engine</div>
                        <div className="text-xl font-bold text-purple-300 mt-1 capitalize">{dbStatus?.type || 'PostgreSQL 16'}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Storage Tier</div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">Neon Serverless</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">SSL Security</div>
                        <div className="text-xl font-bold text-amber-300 mt-1 flex items-center gap-1">
                            <ShieldCheckIcon className="w-5 h-5 text-amber-400" />
                            <span>Required</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Tables Sidebar & SQL Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[500px]">
                {/* Left Column: Tables Registry (4 cols) */}
                <div className="lg:col-span-4 bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col backdrop-blur-xl shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <TableCellsIcon className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-sm font-bold text-white">Database Tables ({filteredTables.length})</h2>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">public schema</span>
                    </div>

                    <input
                        type="text"
                        placeholder="Search tables..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-8 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 mb-3"
                    />

                    <div className="space-y-1.5 overflow-y-auto flex-1 max-h-[520px] pr-1">
                        {filteredTables.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-500">
                                No tables found matching search
                            </div>
                        ) : (
                            filteredTables.map(t => {
                                const isSystem = t.name.startsWith('clarivo_');
                                const isSelected = selectedTable === t.name;

                                return (
                                    <div
                                        key={t.name}
                                        onClick={() => handleSelectTable(t.name)}
                                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                                            isSelected 
                                                ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-md' 
                                                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-xs font-semibold truncate max-w-[180px]">
                                                {t.name}
                                            </span>
                                            {isSystem ? (
                                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                                                    System
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                                                    Dataset
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                                            <span>{t.columns.length} cols</span>
                                            {t.row_count !== undefined && (
                                                <>
                                                    <span>•</span>
                                                    <span>{t.row_count} rows</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Column: SQL Terminal & Results (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    {/* SQL Editor Card */}
                    <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CommandLineIcon className="w-5 h-5 text-cyan-400" />
                                <h2 className="text-sm font-bold text-white">SQL Query Terminal</h2>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => {
                                        const q = 'SELECT * FROM clarivo_datasets ORDER BY created_at DESC LIMIT 20;';
                                        setSqlQuery(q);
                                        handleRunQuery(q);
                                    }}
                                    className="px-2.5 py-1 text-[11px] bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 border border-white/10 font-mono transition-colors"
                                >
                                    Datasets Meta
                                </button>
                                <button
                                    onClick={() => {
                                        const q = 'SELECT id, email, full_name, role, created_at FROM clarivo_users;';
                                        setSqlQuery(q);
                                        handleRunQuery(q);
                                    }}
                                    className="px-2.5 py-1 text-[11px] bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 border border-white/10 font-mono transition-colors"
                                >
                                    Users Table
                                </button>
                                <button
                                    onClick={() => {
                                        const q = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';";
                                        setSqlQuery(q);
                                        handleRunQuery(q);
                                    }}
                                    className="px-2.5 py-1 text-[11px] bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 border border-white/10 font-mono transition-colors"
                                >
                                    All Tables
                                </button>
                            </div>
                        </div>

                        {/* AI Text-to-SQL Copilot Bar */}
                        <div className="p-3 bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-slate-950 rounded-xl border border-cyan-500/30 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                                <div className="flex items-center gap-1.5 font-mono">
                                    <SparklesIcon className="w-4 h-4 text-cyan-400" />
                                    <span>AI Natural Language to SQL Copilot</span>
                                </div>
                                <span className="text-[10px] text-purple-400 font-mono">Gemini 3.6 Flash</span>
                            </div>
                            <form onSubmit={handleGenerateAiSql} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Ask anything in English: e.g. 'Show top 5 datasets ordered by row_count'..."
                                    className="flex-1 h-8 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                                />
                                <button
                                    type="submit"
                                    disabled={isGeneratingSql}
                                    className="px-3.5 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shrink-0 hover:scale-105 disabled:opacity-50"
                                >
                                    <SparklesIcon className={`w-3.5 h-3.5 ${isGeneratingSql ? 'animate-spin' : ''}`} />
                                    <span>{isGeneratingSql ? 'Generating...' : 'Generate SQL'}</span>
                                </button>
                            </form>
                            {sqlAiExplanation && (
                                <div className="text-[11px] text-cyan-300/90 font-mono flex items-center gap-1">
                                    <span className="text-purple-400">⚡ AI Reasoning:</span> {sqlAiExplanation}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <textarea
                                value={sqlQuery}
                                onChange={(e) => setSqlQuery(e.target.value)}
                                rows={4}
                                placeholder="Enter PostgreSQL SQL query (e.g. SELECT * FROM clarivo_datasets LIMIT 10;)"
                                className="w-full p-3 font-mono text-xs bg-slate-950 border border-cyan-500/30 rounded-xl text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none shadow-inner"
                            />
                            
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <button
                                    onClick={() => handleRunQuery()}
                                    disabled={isExecuting}
                                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                                >
                                    <PlayIcon className="w-3.5 h-3.5" />
                                    <span>{isExecuting ? 'Running...' : 'Run Query'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results / Schema Inspector */}
                    <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white">Query Results</h3>
                                {queryResult?.row_count !== undefined && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                        {queryResult.row_count} rows returned
                                    </span>
                                )}
                            </div>

                            {queryResult?.data && queryResult.data.length > 0 && (
                                <button
                                    onClick={exportQueryResult}
                                    className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 border border-white/10 flex items-center gap-1.5 transition-colors"
                                >
                                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                    <span>Export CSV</span>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[380px] rounded-xl border border-white/10 bg-slate-950/80">
                            {queryResult ? (
                                queryResult.success && queryResult.data && queryResult.data.length > 0 ? (() => {
                                    const safeData = queryResult.data;
                                    const cols = queryResult.columns && queryResult.columns.length > 0 
                                        ? queryResult.columns 
                                        : Object.keys(safeData[0] || {});

                                    return (
                                        <table className="w-full text-left text-xs font-mono">
                                            <thead className="bg-slate-900 text-slate-300 sticky top-0 border-b border-white/10">
                                                <tr>
                                                    {cols.map((col) => (
                                                        <th key={col} className="p-2.5 font-semibold text-cyan-300 whitespace-nowrap">
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {safeData.map((row, rIdx) => (
                                                    <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                                                        {cols.map((col) => (
                                                            <td key={col} className="p-2.5 text-slate-300 truncate max-w-xs whitespace-nowrap">
                                                                {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? 'NULL')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    );
                                })() : queryResult.success ? (
                                    <div className="text-center py-12 text-slate-400 text-xs">
                                        Query executed successfully with 0 rows returned.
                                    </div>
                                ) : (
                                    <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-mono m-3">
                                        <div className="font-bold mb-1">Execution Error:</div>
                                        <div>{queryResult.error}</div>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-14 text-slate-400 text-xs">
                                    <CommandLineIcon className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                                    Select a table on the left or click <span className="text-cyan-400 font-semibold">Run Query</span> above to execute SQL.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
