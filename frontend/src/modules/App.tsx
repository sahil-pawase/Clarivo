import React, { useState, useEffect } from 'react';
import { Navigation, TabKey } from './components/Navigation';
import { ActionsSidebar } from './components/ActionsSidebar';
import { DatasetsProvider, useDatasets } from './state/DatasetsContext';
import { AppProvider } from './state/AppContext';
import { AuthProvider, useAuth } from './state/AuthContext';
import { LoginPage } from './screens/LoginPage';
import { AdminDashboard } from './screens/AdminDashboard';
import { StudentDashboard } from './screens/StudentDashboard';
import { Home } from './screens/Home';
import { ViewDataset } from './screens/ViewDataset';
import { Insights } from './screens/Insights';
import { Help } from './screens/Help';
import { Settings } from './screens/Settings';
import { Cleaning } from './screens/Cleaning';
import { EditData } from './screens/EditData';
import { Visualize } from './screens/Visualize';
import { AIAutoProcessor } from './screens/AIAutoProcessor';
import { DatabaseScreen } from './screens/DatabaseScreen';
import { CommandPalette } from './components/CommandPalette';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { ComplianceModal } from './components/ComplianceModal';
import { SystemStatusBar } from './components/SystemStatusBar';

const MainApp: React.FC = () => {
    const { isAuthenticated, role } = useAuth();
    const { selectedId, datasets } = useDatasets();
    const [active, setActive] = useState<TabKey>('dashboard');
    const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('clarivo-left-sidebar-collapsed');
        return saved ? JSON.parse(saved) : false;
    });

    // Enterprise Modals State
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);
    const [isComplianceOpen, setIsComplianceOpen] = useState(false);

    const activeDataset = (datasets || []).find(d => d.id === selectedId);

    // Save collapsed states to localStorage
    useEffect(() => {
        localStorage.setItem('clarivo-left-sidebar-collapsed', JSON.stringify(isLeftSidebarCollapsed));
    }, [isLeftSidebarCollapsed]);

    // Global Enterprise Keyboard shortcuts: Ctrl+K / Cmd+K and Ctrl+Shift+A
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Command Palette (Ctrl+K or Cmd+K)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }

            // Toggle Actions Sidebar (Ctrl+Shift+A)
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                setIsLeftSidebarCollapsed((prev: boolean) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // If not authenticated, show modern LoginPage
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    const isFullWidthScreen = active === 'dashboard' || active === 'database';

    return (
        <div className="h-full flex flex-col bg-[#0A0D14] text-slate-100 overflow-hidden">
            <Navigation 
                active={active} 
                onChange={setActive} 
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />

            <div className="flex-1 flex overflow-hidden p-4 pb-2 gap-4">
                {/* Left Sidebar - Actions (hidden on Dashboard for clean widescreen viewing) */}
                {!isFullWidthScreen && (
                    <div className={`transition-all duration-300 ease-in-out ${isLeftSidebarCollapsed ? 'w-16' : 'w-72'} hidden md:flex flex-col gap-3 relative`}>
                        <button
                            onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
                            className="absolute -right-3 top-4 z-20 w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-cyan-400/30"
                            title={`${isLeftSidebarCollapsed ? 'Expand' : 'Collapse'} Actions Panel (Ctrl+Shift+A)`}
                        >
                            {isLeftSidebarCollapsed ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            )}
                        </button>
                        <ActionsSidebar isCollapsed={isLeftSidebarCollapsed} />
                    </div>
                )}
                
                {/* Main Content */}
                <div className="flex-1 overflow-auto rounded-2xl">
                    {active === 'dashboard' && (
                        role === 'admin' ? (
                            <AdminDashboard onNavigate={(tab) => setActive(tab as TabKey)} />
                        ) : (
                            <StudentDashboard onNavigate={(tab) => setActive(tab as TabKey)} />
                        )
                    )}
                    {active === 'home' && <Home />}
                    {active === 'view' && <ViewDataset />}
                    {active === 'edit' && <EditData />}
                    {active === 'visualize' && <Visualize />}
                    {active === 'insights' && <Insights />}
                    {active === 'cleaning' && <Cleaning />}
                    {active === 'ai-auto' && <AIAutoProcessor />}
                    {active === 'database' && <DatabaseScreen onNavigate={(tab) => setActive(tab as TabKey)} />}
                    {active === 'help' && <Help />}
                    {active === 'settings' && <Settings />}
                </div>
            </div>

            {/* Enterprise System Diagnostics & Status Bar */}
            <SystemStatusBar 
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                onOpenExecutiveReport={() => setIsExecutiveReportOpen(true)}
                onOpenCompliance={() => setIsComplianceOpen(true)}
            />

            {/* Enterprise Floating Command Center (Ctrl+K / ⌘K) */}
            <CommandPalette 
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                onNavigate={(tab) => setActive(tab as TabKey)}
                onOpenExecutiveReport={() => setIsExecutiveReportOpen(true)}
                onOpenCompliance={() => setIsComplianceOpen(true)}
            />

            {/* C-Suite Executive Briefing Modal */}
            <ExecutiveReportModal
                isOpen={isExecutiveReportOpen}
                onClose={() => setIsExecutiveReportOpen(false)}
                datasetId={selectedId}
                datasetName={activeDataset?.name}
            />

            {/* Governance & Compliance Modal */}
            <ComplianceModal
                isOpen={isComplianceOpen}
                onClose={() => setIsComplianceOpen(false)}
                datasetId={selectedId}
                datasetName={activeDataset?.name}
            />
        </div>
    );
};

export const App: React.FC = () => {
    return (
        <AuthProvider>
            <DatasetsProvider>
                <AppProvider>
                    <MainApp />
                </AppProvider>
            </DatasetsProvider>
        </AuthProvider>
    );
};
