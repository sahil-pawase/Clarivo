import React, { useState, useEffect } from 'react';
import { 
    XMarkIcon, ShieldCheckIcon, ShieldExclamationIcon, 
    CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon,
    LockClosedIcon, KeyIcon
} from '@heroicons/react/24/outline';
import { getDatasetCompliance, ComplianceReport } from '../services/api';
import toast from 'react-hot-toast';

interface ComplianceModalProps {
    isOpen: boolean;
    onClose: () => void;
    datasetId?: string | null;
    datasetName?: string;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
    isOpen,
    onClose,
    datasetId,
    datasetName
}) => {
    const [compliance, setCompliance] = useState<ComplianceReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCompliance = async () => {
        if (!datasetId) {
            toast.error('Select a dataset first');
            return;
        }
        setIsLoading(true);
        try {
            const data = await getDatasetCompliance(datasetId);
            setCompliance(data);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Compliance scan failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && datasetId) {
            fetchCompliance();
        }
    }, [isOpen, datasetId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <div 
                className="w-full max-w-3xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col max-h-[88vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 p-[1px] shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                                <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-white tracking-tight">Enterprise Governance & PII Compliance Scanner</h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
                                    GDPR / SOC2 Ready
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Target Dataset: <span className="font-semibold text-slate-200">{datasetName || 'Active Portfolio'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchCompliance}
                            disabled={isLoading}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                            title="Rescan"
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-200">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <ArrowPathIcon className="w-8 h-8 text-emerald-400 animate-spin" />
                            <div className="text-sm font-semibold text-white">Scanning dataset for PII & Compliance Vectors...</div>
                        </div>
                    ) : !compliance ? (
                        <div className="py-16 text-center text-slate-400 text-sm">
                            No scan results. Click rescan to execute.
                        </div>
                    ) : (
                        <>
                            {/* Score Overview */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Hygiene Score</div>
                                        <div className="text-3xl font-extrabold text-white mt-1">{compliance.hygiene_score}%</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Composite Data Quality</div>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl font-bold text-emerald-300">
                                        {compliance.grade}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">PII Exposure</div>
                                    <div className="text-2xl font-bold text-white mt-1">
                                        {compliance.pii_detected ? (
                                            <span className="text-amber-400 flex items-center gap-1.5">
                                                <ExclamationTriangleIcon className="w-5 h-5" />
                                                {compliance.total_pii_columns} Column(s)
                                            </span>
                                        ) : (
                                            <span className="text-emerald-400 flex items-center gap-1.5">
                                                <CheckCircleIcon className="w-5 h-5" />
                                                0 Columns
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Sensitive attributes found</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Data Hygiene</div>
                                    <div className="text-2xl font-bold text-white mt-1">
                                        {compliance.metrics.null_percentage}%
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Missing attribute density</div>
                                </div>
                            </div>

                            {/* Compliance Frameworks */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2.5">
                                    Enterprise Compliance Frameworks
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(compliance.compliance_frameworks || {}).map(([key, fw]) => (
                                        <div key={key} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-white uppercase font-mono">{key}</div>
                                                <div className="text-[10px] text-emerald-400">{fw.badge}</div>
                                            </div>
                                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                {fw.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PII Flags */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2.5">
                                    Attribute Level Findings ({compliance.flags?.length || 0})
                                </div>
                                {(!compliance.flags || compliance.flags.length === 0) ? (
                                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                                        <span>No sensitive PII (Emails, Credit Cards, Social Security Numbers) detected in this dataset. It is safe for standard internal analytics.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {compliance.flags.map((flag, idx) => (
                                            <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono text-xs font-semibold text-white">Column: {flag.column}</span>
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                                                        flag.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                                    }`}>
                                                        {flag.severity}: {flag.pii_type}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    Recommendation: {flag.recommendation}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[10px]">SOC-2 TYPE II AUDITED ENGINE</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

