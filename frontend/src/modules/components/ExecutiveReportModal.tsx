import React, { useState, useEffect } from 'react';
import { 
    XMarkIcon, SparklesIcon, PrinterIcon, DocumentDuplicateIcon,
    ArrowTrendingUpIcon, ShieldExclamationIcon, CheckCircleIcon,
    ArrowDownTrayIcon, ChartBarIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getExecutiveReport, ExecutiveReport } from '../services/api';
import toast from 'react-hot-toast';

interface ExecutiveReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    datasetId?: string | null;
    datasetName?: string;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
    isOpen,
    onClose,
    datasetId,
    datasetName
}) => {
    const [report, setReport] = useState<ExecutiveReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchReport = async () => {
        if (!datasetId) {
            toast.error('Please select a dataset first');
            return;
        }
        setIsLoading(true);
        try {
            const data = await getExecutiveReport(datasetId);
            setReport(data);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to generate executive report');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && datasetId) {
            fetchReport();
        }
    }, [isOpen, datasetId]);

    const handleCopyMarkdown = () => {
        if (!report) return;
        const md = `# Executive Briefing: ${report.dataset_name}
**Generated**: ${new Date(report.generated_at).toLocaleString()}
**Classification**: Enterprise Confidential

## ${report.headline}

### Executive Summary
${report.executive_summary}

### Key Performance Indicators
${(report.kpis || []).map(k => `- **${k.label}**: ${k.value} (${k.subtext || ''})`).join('\n')}

### Strategic Findings
${(report.strategic_insights || []).map(s => `#### [${s.impact}] ${s.title}\n${s.description}`).join('\n\n')}

### Risk Matrix & Governance
${(report.risk_matrix || []).map(r => `- **${r.risk}** [${r.severity}]: ${r.mitigation}`).join('\n')}

### Recommended Strategic Initiatives
${(report.recommended_initiatives || []).map(i => `1. **${i.initiative}** (${i.timeline}) - Expected Outcome: ${i.expected_outcome}`).join('\n')}
`;
        navigator.clipboard.writeText(md);
        toast.success('Executive briefing copied as Markdown');
    };

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <div 
                className="w-full max-w-4xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-6 py-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 p-[1px] shadow-lg shadow-purple-500/20 flex items-center justify-center">
                            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5 text-purple-400" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-white tracking-tight">C-Suite Executive Intelligence Briefing</h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-mono">
                                    Gemini 3.6 Flash
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Target Dataset: <span className="font-semibold text-slate-200">{datasetName || report?.dataset_name || 'Active Data Portfolio'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {report && (
                            <>
                                <button
                                    onClick={handleCopyMarkdown}
                                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                                    title="Copy Markdown"
                                >
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Copy Brief</span>
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                                    title="Print / Save PDF"
                                >
                                    <PrinterIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Export PDF</span>
                                </button>
                            </>
                        )}
                        <button
                            onClick={fetchReport}
                            disabled={isLoading}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                            title="Regenerate Report"
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all ml-1"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 animate-spin flex items-center justify-center p-[2px]">
                                <div className="w-full h-full bg-slate-900 rounded-[14px]" />
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-semibold text-white">Synthesizing Executive Decision Intelligence...</div>
                                <div className="text-xs text-slate-400 mt-1">Analyzing cross-attribute correlations, risk factors & strategic signals</div>
                            </div>
                        </div>
                    ) : !report ? (
                        <div className="py-16 text-center text-slate-400 text-sm">
                            No report generated. Click regenerate to synthesize intelligence.
                        </div>
                    ) : (
                        <>
                            {/* Headline Banner */}
                            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-500/30">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono mb-1">
                                    Strategic Thesis & Executive Summary
                                </div>
                                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                    {report.headline}
                                </h1>
                                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                                    {report.executive_summary}
                                </p>
                            </div>

                            {/* KPI Grid */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                                    Portfolio Core Metrics & Signal Health
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {(report.kpis || []).map((kpi, idx) => (
                                        <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all">
                                            <div className="text-[11px] text-slate-400 truncate">{kpi.label}</div>
                                            <div className="text-xl font-bold text-white mt-1">{kpi.value}</div>
                                            {kpi.subtext && (
                                                <div className="text-[10px] text-cyan-400 mt-0.5 truncate">{kpi.subtext}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Strategic Insights */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                                    High-Impact Findings & Discoveries
                                </div>
                                <div className="space-y-3">
                                    {(report.strategic_insights || []).map((insight, idx) => (
                                        <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-white/10 flex items-start justify-between gap-4">
                                            <div>
                                                <div className="font-semibold text-white text-xs sm:text-sm">{insight.title}</div>
                                                <div className="text-xs text-slate-300 mt-1 leading-relaxed">{insight.description}</div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                                                insight.impact === 'Critical' 
                                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                                                    : insight.impact === 'High' 
                                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                                                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                            }`}>
                                                {insight.impact} Impact
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Risk Matrix & Governance */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 font-mono mb-3">
                                        <ShieldExclamationIcon className="w-4 h-4" />
                                        <span>Risk Matrix & Governance Flags</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {(report.risk_matrix || []).map((risk, idx) => (
                                            <div key={idx} className="text-xs">
                                                <div className="flex items-center justify-between text-white font-medium">
                                                    <span>{risk.risk}</span>
                                                    <span className="text-[10px] text-rose-400 font-mono uppercase">{risk.severity}</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">Mitigation: {risk.mitigation}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono mb-3">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        <span>Recommended Next Initiatives</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {(report.recommended_initiatives || []).map((init, idx) => (
                                            <div key={idx} className="text-xs">
                                                <div className="flex items-center justify-between text-white font-medium">
                                                    <span>{init.initiative}</span>
                                                    <span className="text-[10px] text-emerald-400 font-mono">{init.timeline}</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">Target: {init.expected_outcome}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span>CONFIDENTIAL & PROPRIETARY</span>
                        <span>•</span>
                        <span>CLARIVO ENTERPRISE AI</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

