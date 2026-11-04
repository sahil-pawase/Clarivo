import React, { useState, useEffect, useRef } from 'react';
import { 
    MagnifyingGlassIcon, SparklesIcon, ChartBarIcon, CircleStackIcon,
    TableCellsIcon, WrenchScrewdriverIcon, ShieldCheckIcon, DocumentTextIcon,
    ArrowRightIcon, XMarkIcon, BoltIcon, AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useDatasets } from '../state/DatasetsContext';
import { useAuth } from '../state/AuthContext';
import { seedEnterpriseDemo } from '../services/api';
import toast from 'react-hot-toast';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (tab: any) => void;
    onOpenExecutiveReport?: () => void;
    onOpenCompliance?: () => void;
}

export interface PaletteAction {
    id: string;
    title: string;
    category: string;
    subtitle?: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
    action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    onNavigate,
    onOpenExecutiveReport,
    onOpenCompliance
}) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { datasets, select, selectedId, refresh } = useDatasets();
    const { role, switchRole } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Define all available command actions
    const baseActions: PaletteAction[] = [
        {
            id: 'exec-report',
            title: 'Generate Executive Briefing & C-Suite Report',
            category: 'AI & Intelligence',
            icon: DocumentTextIcon,
            badge: 'Gemini AI',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            action: () => {
                onClose();
                onOpenExecutiveReport?.();
            }
        },
        {
            id: 'sql-copilot',
            title: 'Open AI SQL Copilot & Database Explorer',
            category: 'Data & SQL',
            icon: CircleStackIcon,
            badge: 'PostgreSQL',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
            action: () => {
                onClose();
                onNavigate('database');
            }
        },
        {
            id: 'compliance-audit',
            title: 'Run Data Governance, Hygiene & PII Audit',
            category: 'Security & Compliance',
            icon: ShieldCheckIcon,
            badge: 'GDPR / SOC2',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            action: () => {
                onClose();
                onOpenCompliance?.();
            }
        },
        {
            id: 'seed-demo',
            title: 'Seed Fortune 500 Enterprise Benchmark Datasets',
            category: 'Demo & Benchmarks',
            icon: SparklesIcon,
            badge: '1-Click Setup',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            action: async () => {
                onClose();
                toast.loading('Seeding enterprise datasets...', { id: 'seed' });
                try {
                    const res = await seedEnterpriseDemo();
                    toast.success(res.message || 'Enterprise datasets seeded!', { id: 'seed' });
                    refresh();
                } catch {
                    toast.error('Could not seed demo datasets', { id: 'seed' });
                }
            }
        },
        {
            id: 'nav-visualize',
            title: 'Visualize Data (Plotly Studio, Heatmaps, Scatters)',
            category: 'Navigation',
            icon: ChartBarIcon,
            action: () => {
                onClose();
                onNavigate('visualize');
            }
        },
        {
            id: 'nav-insights',
            title: 'AI Conversational Insights & Chat',
            category: 'Navigation',
            icon: SparklesIcon,
            action: () => {
                onClose();
                onNavigate('insights');
            }
        },
        {
            id: 'nav-clean',
            title: 'Data Cleaning & Automated Imputation',
            category: 'Navigation',
            icon: WrenchScrewdriverIcon,
            action: () => {
                onClose();
                onNavigate('cleaning');
            }
        },
        {
            id: 'switch-role',
            title: `Switch Workspace Role (Current: ${role.toUpperCase()})`,
            category: 'Role Management',
            icon: AcademicCapIcon,
            action: () => {
                onClose();
                switchRole(role === 'admin' ? 'student' : 'admin');
                toast.success(`Switched role to ${role === 'admin' ? 'Student' : 'Admin'}`);
            }
        }
    ];

    // Dataset selector actions
    const datasetActions: PaletteAction[] = (datasets || []).map(ds => ({
        id: `ds-${ds.id}`,
        title: `Switch Dataset: ${ds.name}`,
        subtitle: `${ds.rows || 0} rows • ${ds.columns || 0} cols`,
        category: 'Active Datasets',
        icon: TableCellsIcon,
        badge: ds.id === selectedId ? 'Active' : undefined,
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        action: () => {
            select(ds.id);
            onClose();
            toast.success(`Switched active dataset to: ${ds.name}`);
        }
    }));

    const allItems = [...baseActions, ...datasetActions];
    const filteredItems = allItems.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase()))
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    filteredItems[selectedIndex].action();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
            <div 
                className="w-full max-w-2xl bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Bar */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-slate-950/60">
                    <MagnifyingGlassIcon className="w-5 h-5 text-cyan-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Type a command, query, or search dataset (or press Esc to exit)..."
                        className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                        <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white/10 text-slate-300 rounded border border-white/10">ESC</kbd>
                    </div>
                </div>

                {/* Command Items List */}
                <div className="max-h-96 overflow-y-auto p-2 space-y-1">
                    {filteredItems.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                            No commands matching "{search}"
                        </div>
                    ) : (
                        filteredItems.map((item, idx) => {
                            const isSelected = idx === selectedIndex;
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => item.action()}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                                        isSelected 
                                            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 border border-cyan-500/40 text-white shadow-md' 
                                            : 'text-slate-300 hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            isSelected ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/5 text-slate-400'
                                        }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="truncate text-left">
                                            <div className="text-xs font-medium text-white flex items-center gap-2">
                                                <span>{item.title}</span>
                                                {item.badge && (
                                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${item.badgeColor || 'bg-white/10 text-slate-300 border-white/10'}`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                                <span>{item.category}</span>
                                                {item.subtitle && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="font-mono">{item.subtitle}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="flex items-center gap-1 text-[11px] text-cyan-400 shrink-0 font-mono">
                                            <span>Select</span>
                                            <ArrowRightIcon className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer hints */}
                <div className="px-4 py-2 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/10 rounded">↑</kbd>
                            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/10 rounded">↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/10 rounded">↵</kbd>
                            Execute
                        </span>
                    </div>
                    <span className="text-[10px] text-cyan-400/80 font-mono">Clarivo Command Center</span>
                </div>
            </div>
        </div>
    );
};

