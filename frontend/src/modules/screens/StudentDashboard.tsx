import React, { useState } from 'react';
import { useDatasets } from '../state/DatasetsContext';
import { useAuth } from '../state/AuthContext';
import { 
    AcademicCapIcon, SparklesIcon, ChartBarIcon, BookOpenIcon,
    BriefcaseIcon, LightBulbIcon, CloudArrowUpIcon, ArrowRightIcon,
    MagnifyingGlassIcon, PlayCircleIcon, VideoCameraIcon,
    ClockIcon, UserGroupIcon, CheckCircleIcon, SignalIcon
} from '@heroicons/react/24/outline';

export const StudentDashboard: React.FC<{ onNavigate?: (tab: string, datasetId?: string) => void }> = ({ onNavigate }) => {
    const { user } = useAuth();
    const { datasets, selectDataset } = useDatasets();
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isAskingAi, setIsAskingAi] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const careerTracks = [
        {
            title: 'Data Analyst & BI Specialist',
            stream: 'Business Analytics & Visualizations',
            salary: '₹6-12 LPA',
            difficulty: 'Beginner Friendly',
            skills: ['Data Cleaning', 'Plotly Charts', 'SQL Queries', 'Reporting'],
            tagColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10'
        },
        {
            title: 'Machine Learning Data Engineer',
            stream: 'Feature Engineering & Models',
            salary: '₹10-22 LPA',
            difficulty: 'Intermediate',
            skills: ['Imputation', 'Variance Analysis', 'Statistical Testing', 'Pipelines'],
            tagColor: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
        },
        {
            title: 'AI Analytics Consultant',
            stream: 'GenAI & Strategic Intelligence',
            salary: '₹14-28 LPA',
            difficulty: 'Advanced',
            skills: ['Gemini LLM', 'Executive Summaries', 'Automated Insights', 'Decision Modeling'],
            tagColor: 'border-purple-500/30 text-purple-300 bg-purple-500/10'
        }
    ];

    const handleAskAi = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiQuestion.trim()) return;
        setIsAskingAi(true);
        setAiResponse(null);

        try {
            const studentDs = datasets.find(d => d.name.toLowerCase().includes('student') || d.name.toLowerCase().includes('career')) || datasets[0];
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            
            if (studentDs) {
                const res = await fetch(`${apiUrl}/api/v1/datasets/${studentDs.id}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: aiQuestion, dataset_id: studentDs.id })
                });
                const data = await res.json();
                if (res.ok && data.response) {
                    setAiResponse(data.response);
                } else {
                    setAiResponse(`🎓 AI Learning Guide:\n\nRegarding "${aiQuestion}": In data science and statistics, key concepts rely on understanding distributions, relationships, and trends. You can visualize this by opening the **Visualize** tab and selecting a Scatter or Bar chart!`);
                }
            } else {
                setAiResponse(`🎓 AI Learning Guide:\n\nRegarding "${aiQuestion}": When analyzing data, first inspect the columns, clean missing values, and choose appropriate charts (e.g. Histograms for distributions, Bar charts for categories).`);
            }
        } catch {
            setAiResponse(`🎓 AI Learning Guide:\n\n"${aiQuestion}" is a great topic! In Clarivo, you can upload your CSV/Excel file, click Auto-Clean to fix missing data, and generate instant charts with Gemini AI.`);
        } finally {
            setIsAskingAi(false);
        }
    };

    const filteredDatasets = datasets.filter(ds => 
        ds.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto max-w-7xl mx-auto select-none">
            {/* 1. Analyst Header Banner */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-emerald-500/20 bg-gradient-to-r from-slate-900/95 via-emerald-950/20 to-slate-900/95 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                            <SparklesIcon className="w-3.5 h-3.5 text-emerald-400" />
                            DATA ANALYST WORKSPACE
                        </span>
                        <span className="text-xs text-slate-400">Interactive BI • Gemini Copilot • SQL Explorer</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Welcome back, {user?.fullName}</h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">Explore loaded datasets, generate automated Gemini insights, and build interactive visualizations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onNavigate && onNavigate('visualize')}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg hover:scale-105"
                    >
                        <ChartBarIcon className="w-4 h-4 text-slate-950" />
                        <span>Visualize Studio</span>
                    </button>
                    <button
                        onClick={() => onNavigate && onNavigate('database')}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                        <SparklesIcon className="w-4 h-4 text-purple-400" />
                        <span>AI SQL Explorer</span>
                    </button>
                </div>
            </div>

            {/* 2. Quick Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 flex items-center gap-3.5 shadow-lg">
                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <ChartBarIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-white">{datasets.length} Datasets</div>
                        <div className="text-[11px] text-slate-400">Available in memory</div>
                    </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 flex items-center gap-3.5 shadow-lg">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-white">Gemini AI</div>
                        <div className="text-[11px] text-slate-400">AI Intelligence Core</div>
                    </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 flex items-center gap-3.5 shadow-lg">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircleIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-white">PostgreSQL 16</div>
                        <div className="text-[11px] text-slate-400">Neon Cloud Cluster</div>
                    </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 flex items-center gap-3.5 shadow-lg">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <BriefcaseIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-white">SOC-2 Aligned</div>
                        <div className="text-[11px] text-slate-400">Data Governance Ready</div>
                    </div>
                </div>
            </div>

            {/* 3. Action Studio Highlight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Visual Analytics Highlight */}
                <div className="bg-slate-900/90 rounded-3xl p-5 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900 to-slate-950 shadow-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 font-mono">
                                <ChartBarIcon className="w-3.5 h-3.5 text-cyan-400" />
                                PLOTLY VISUALIZATION STUDIO
                            </span>
                            <span className="text-xs text-cyan-400 font-mono">10+ Chart Types</span>
                        </div>

                        <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
                            Multi-Variate Plots: Scatters, Histograms & Heatmaps
                        </h3>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                            Interactively analyze distributions, identify cross-column correlations, and detect visual outliers with zoomable Plotly and Recharts engines.
                        </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-300 font-mono">Scatter • Box • Bar • Heatmap</div>
                        <button
                            onClick={() => onNavigate && onNavigate('visualize')}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md hover:scale-105"
                        >
                            <PlayCircleIcon className="w-4 h-4" />
                            <span>Launch Studio</span>
                        </button>
                    </div>
                </div>

                {/* AI Text-to-SQL Studio Highlight */}
                <div className="bg-slate-900/90 rounded-3xl p-5 border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900 to-slate-950 shadow-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 font-mono">
                                <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
                                AI NATURAL LANGUAGE TO SQL
                            </span>
                            <span className="text-xs text-purple-300 font-mono">PostgreSQL Engine</span>
                        </div>

                        <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
                            Schema-Grounded Conversational SQL Copilot
                        </h3>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                            Ask complex questions in plain English. Clarivo inspects live database table schemas and translates your intent into safe, optimized SQL queries.
                        </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-300 font-mono">Neon Cloud Cluster</div>
                        <button
                            onClick={() => onNavigate && onNavigate('database')}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md hover:scale-105"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            <span>Open SQL Copilot</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. AI Learning Tutor Assistant */}
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-cyan-500/20 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-base font-semibold text-slate-100">Clarivo AI Analytics Copilot (Powered by Google Gemini)</h2>
                    <span className="text-xs text-slate-400 ml-auto">Ask any question about datasets, statistics, or charts</span>
                </div>

                <form onSubmit={handleAskAi} className="flex gap-2">
                    <input
                        type="text"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        placeholder="e.g. Explain how to find the correlation between variables, or suggest best chart for distribution..."
                        className="flex-1 px-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/60 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isAskingAi || !aiQuestion.trim()}
                        className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-lg hover:scale-105 disabled:opacity-50"
                    >
                        {isAskingAi ? 'Thinking...' : 'Ask AI'}
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                </form>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {[
                        'What is the difference between Mean and Median?',
                        'How do I find outliers in my data?',
                        'Suggest best charts for Sales & Revenue',
                        'Key drivers of business metrics'
                    ].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => {
                                setAiQuestion(suggestion);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all"
                        >
                            💡 {suggestion}
                        </button>
                    ))}
                </div>

                {/* AI Response Display */}
                {aiResponse && (
                    <div className="mt-4 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap animate-fadeIn">
                        {aiResponse}
                    </div>
                )}
            </div>

            {/* 5. Career & Study Pathways */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <BriefcaseIcon className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-base font-semibold text-slate-100">Featured Career Pathways & Skill Tracks</h2>
                    </div>
                    <span className="text-xs text-slate-400">Grounded in data analytics</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {careerTracks.map((track, i) => (
                        <div key={i} className="rounded-2xl p-5 border border-white/10 bg-slate-900/50 hover:border-emerald-500/30 transition-all flex flex-col justify-between shadow-lg">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${track.tagColor}`}>
                                        {track.difficulty}
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-400">{track.salary}</span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-100 mb-1">{track.title}</h3>
                                <p className="text-xs text-slate-400 mb-3">{track.stream}</p>
                                
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {track.skills.map((s) => (
                                        <span key={s} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const careerDs = datasets.find(d => d.name.toLowerCase().includes('career')) || datasets[0];
                                    if (careerDs) {
                                        selectDataset(careerDs.id);
                                        onNavigate && onNavigate('view', careerDs.id);
                                    }
                                }}
                                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition-all"
                            >
                                <span>Explore Career Dataset</span>
                                <ArrowRightIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 6. Practice & Learning Datasets Explorer */}
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-100">Practice & Learning Datasets</h2>
                        <p className="text-xs text-slate-400">Click any dataset to open interactive visualization and analysis</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <MagnifyingGlassIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search datasets..."
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400/60"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredDatasets.map((ds) => (
                        <div
                            key={ds.id}
                            className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                                    <ChartBarIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-200">{ds.name}</h4>
                                    <p className="text-xs text-slate-500">
                                        {(ds.rows || 0).toLocaleString()} rows • {ds.columns || 0} columns
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        selectDataset(ds.id);
                                        onNavigate && onNavigate('visualize', ds.id);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1 transition-all"
                                >
                                    <PlayCircleIcon className="w-4 h-4" />
                                    <span>Visualize</span>
                                </button>
                                <button
                                    onClick={() => {
                                        selectDataset(ds.id);
                                        onNavigate && onNavigate('insights', ds.id);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all"
                                >
                                    <LightBulbIcon className="w-4 h-4" />
                                    <span>Insights</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
