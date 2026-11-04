import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAuth, UserRole } from '../state/AuthContext';
import { 
    ArrowRightOnRectangleIcon, ArrowsRightLeftIcon, ShieldCheckIcon, 
    AcademicCapIcon, SparklesIcon, Cog6ToothIcon, QuestionMarkCircleIcon,
    CircleStackIcon, LockClosedIcon, XMarkIcon, VideoCameraIcon,
    BookOpenIcon, ChartBarIcon, TableCellsIcon, EyeIcon, CommandLineIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export type TabKey = 'dashboard' | 'home' | 'view' | 'edit' | 'visualize' | 'insights' | 'cleaning' | 'ai-auto' | 'database' | 'help' | 'settings';

export const Navigation: React.FC<{ 
    active: TabKey; 
    onChange: (t: TabKey) => void;
    onOpenCommandPalette?: () => void;
}> = ({ active, onChange, onOpenCommandPalette }) => {
    const { user, role, logout, switchRole, login } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showAdminPassModal, setShowAdminPassModal] = useState(false);
    const [adminPasswordInput, setAdminPasswordInput] = useState('');
    const [adminEmailInput, setAdminEmailInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleRoleButtonClick = () => {
        if (role === 'admin') {
            // Admins can easily view student mode
            switchRole('student');
        } else {
            // Students MUST authenticate to become admin
            setAdminEmailInput('pawasesahil2004@gmail.com');
            setAdminPasswordInput('');
            setShowAdminPassModal(true);
        }
    };

    const handleVerifyAdminAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminPasswordInput.trim()) {
            toast.error('Please enter admin password');
            return;
        }

        setIsVerifying(true);
        try {
            const success = await login(adminEmailInput.trim(), adminPasswordInput, 'admin');
            if (success) {
                setShowAdminPassModal(false);
                setAdminPasswordInput('');
                toast.success('Admin authorization verified');
            } else {
                toast.error('Invalid admin credentials. Access denied.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <>
            <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl relative z-30 select-none">
                {/* Top gradient glow line */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 opacity-90" />
                
                {/* Logo and Brand */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onChange('dashboard')}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                        <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-300 tracking-wider flex items-center gap-1.5">
                            CLARIVO
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-white/10 text-slate-300 rounded">v1.0</span>
                        </div>
                        <div className="text-[10px] text-slate-400 -mt-0.5">AI Data Platform</div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <nav className="hidden lg:flex items-center gap-1 bg-slate-900/70 p-1 rounded-2xl border border-white/5 shadow-inner">
                    <TabButton label="Dashboard" active={active === 'dashboard'} onClick={() => onChange('dashboard')} />
                    <TabButton label="Datasets" active={active === 'home'} onClick={() => onChange('home')} />
                    <TabButton label="View Data" active={active === 'view'} onClick={() => onChange('view')} />
                    <TabButton label="Visualize" active={active === 'visualize'} onClick={() => onChange('visualize')} />
                    <TabButton label="Insights" active={active === 'insights'} onClick={() => onChange('insights')} />
                    <TabButton label="Clean Data" active={active === 'cleaning'} onClick={() => onChange('cleaning')} />
                    <TabButton 
                        label="AI Auto" 
                        active={active === 'ai-auto'} 
                        onClick={() => onChange('ai-auto')}
                        icon={<SparklesIcon className="w-3.5 h-3.5 text-cyan-400" />}
                    />
                    
                    {/* Database / SQL Tab is restricted strictly to Administrator */}
                    {role === 'admin' && (
                        <TabButton 
                            label="Database / SQL" 
                            active={active === 'database'} 
                            onClick={() => onChange('database')}
                            icon={<CircleStackIcon className="w-3.5 h-3.5 text-purple-400" />}
                        />
                    )}
                </nav>

                {/* User Profile & Role Switcher */}
                <div className="flex items-center gap-3 relative">
                    {/* Command Palette Trigger */}
                    {onOpenCommandPalette && (
                        <button
                            onClick={onOpenCommandPalette}
                            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono transition-all hover:border-cyan-500/40 hover:text-cyan-300 shadow-sm"
                            title="Open Command Center (Ctrl+K or ⌘K)"
                        >
                            <CommandLineIcon className="w-3.5 h-3.5 text-cyan-400" />
                            <span>⌘K</span>
                        </button>
                    )}

                    {/* Role Badge Button with Secure Transition */}
                    <button
                        onClick={handleRoleButtonClick}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border shadow-sm transition-all hover:scale-105 ${
                            role === 'admin'
                                ? 'bg-purple-950/50 border-purple-500/30 text-purple-300 hover:bg-purple-900/50'
                                : 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50'
                        }`}
                        title={role === 'admin' ? 'Click to view Student Hub' : 'Click to authorize as Admin'}
                    >
                        {role === 'admin' ? (
                            <ShieldCheckIcon className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                            <AcademicCapIcon className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span className="capitalize">{role}</span>
                        <ArrowsRightLeftIcon className="w-3 h-3 opacity-60 ml-0.5" />
                    </button>

                    {/* Profile Avatar & Name */}
                    <div 
                        className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-white/5 transition-all"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-slate-800 flex items-center justify-center shadow-md">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-slate-200">{user?.fullName?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                        <div className="hidden sm:block text-left">
                            <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{user?.fullName || 'User'}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email || 'user@clarivo.io'}</div>
                        </div>
                    </div>

                    {/* Profile Dropdown Menu */}
                    {showProfileMenu && (
                        <div className="absolute right-0 top-12 w-56 rounded-2xl glass border border-white/10 bg-slate-900/95 shadow-2xl p-2 z-50 animate-fadeIn">
                            <div className="p-3 border-b border-white/10 mb-1">
                                <div className="text-xs font-bold text-slate-100">{user?.fullName}</div>
                                <div className="text-[11px] text-slate-400">{user?.email}</div>
                                <div className="mt-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-cyan-300 capitalize">
                                    {role} Mode
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    onChange('settings');
                                    setShowProfileMenu(false);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2 transition-all"
                            >
                                <Cog6ToothIcon className="w-4 h-4" />
                                <span>Account Settings</span>
                            </button>

                            <button
                                onClick={() => {
                                    onChange('help');
                                    setShowProfileMenu(false);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2 transition-all"
                            >
                                <QuestionMarkCircleIcon className="w-4 h-4" />
                                <span>Help & Docs</span>
                            </button>

                            <button
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    handleRoleButtonClick();
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10 rounded-xl flex items-center gap-2 transition-all"
                            >
                                <ArrowsRightLeftIcon className="w-4 h-4" />
                                <span>Switch to {role === 'admin' ? 'Student' : 'Admin'} Mode</span>
                            </button>

                            <div className="border-t border-white/10 my-1" />

                            <button
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    logout();
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-2 transition-all"
                            >
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Admin Password Prompt Portal Modal */}
            {showAdminPassModal && typeof document !== 'undefined' && ReactDOM.createPortal(
                <div 
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowAdminPassModal(false); }}
                >
                    <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                                    <ShieldCheckIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Admin Authentication</h3>
                                    <p className="text-[11px] text-slate-400">Enter administrator credentials to proceed</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAdminPassModal(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleVerifyAdminAuth} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">Admin Email</label>
                                <input
                                    type="email"
                                    required
                                    value={adminEmailInput}
                                    onChange={(e) => setAdminEmailInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">Admin Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        autoFocus
                                        placeholder="••••••••"
                                        value={adminPasswordInput}
                                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono"
                                    />
                                    <LockClosedIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdminPassModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all shadow-lg hover:scale-105 disabled:opacity-50"
                                >
                                    {isVerifying ? 'Verifying...' : 'Authenticate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

const TabButton: React.FC<{ label: string; active?: boolean; icon?: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ label, active, icon, ...props }) => (
    <button
        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
            active 
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/30 shadow-md font-semibold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
        {...props}
    >
        {icon}
        <span>{label}</span>
    </button>
);
