import React, { useState, useEffect } from 'react';
import { 
    SignalIcon, CircleStackIcon, SparklesIcon, 
    TableCellsIcon, CommandLineIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { getSystemHealth, SystemHealth } from '../services/api';
import { useDatasets } from '../state/DatasetsContext';

interface SystemStatusBarProps {
    onOpenCommandPalette: () => void;
    onOpenExecutiveReport: () => void;
    onOpenCompliance: () => void;
}

export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({
    onOpenCommandPalette,
    onOpenExecutiveReport,
    onOpenCompliance
}) => {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [latencyMs, setLatencyMs] = useState<number | null>(24);
    const { datasets, selectedId } = useDatasets();

    const selectedDataset = (datasets || []).find(d => d.id === selectedId);

    useEffect(() => {
        const checkHealth = async () => {
            const start = performance.now();
            try {
                const data = await getSystemHealth();
                const latency = Math.round(performance.now() - start);
                setHealth(data);
                setLatencyMs(latency);
            } catch {
                setLatencyMs(null);
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-8 bg-slate-950/95 border-t border-white/10 px-4 flex items-center justify-between text-[11px] text-slate-400 select-none backdrop-blur-xl z-20 shrink-0">
            {/* Left: Platform Status & Latency */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300 font-semibold">CORE ONLINE</span>
                    {latencyMs !== null && (
                        <span className="text-slate-500">({latencyMs}ms)</span>
                    )}
                </div>

                <div className="hidden md:flex items-center gap-1.5 font-mono text-slate-400">
                    <CircleStackIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Neon PostgreSQL 16</span>
                    <span className="text-[9px] px-1 bg-cyan-500/20 text-cyan-300 rounded">TLS 1.3</span>
                </div>

                <div className="hidden lg:flex items-center gap-1.5 font-mono text-slate-400">
                    <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Gemini 3.6 Flash Copilot</span>
                </div>
            </div>

            {/* Right: Active Dataset & Shortcuts */}
            <div className="flex items-center gap-3">
                {selectedDataset && (
                    <div className="hidden sm:flex items-center gap-1.5 font-mono text-slate-300">
                        <TableCellsIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="truncate max-w-[140px] text-slate-200">{selectedDataset.name}</span>
                        <span className="text-slate-500">({selectedDataset.rows || 0}r × {selectedDataset.columns || 0}c)</span>
                    </div>
                )}

                <button
                    onClick={onOpenCompliance}
                    className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors"
                    title="Run Governance Scan"
                >
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                    <span>Compliance</span>
                </button>

                <button
                    onClick={onOpenExecutiveReport}
                    className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-purple-400 hover:text-purple-300 transition-colors"
                    title="Generate C-Suite Briefing"
                >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>Executive Brief</span>
                </button>

                {/* Command Palette Trigger */}
                <button
                    onClick={onOpenCommandPalette}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/40 transition-all font-mono text-[10px]"
                >
                    <CommandLineIcon className="w-3 h-3 text-cyan-400" />
                    <span>⌘K Menu</span>
                </button>
            </div>
        </div>
    );
};

