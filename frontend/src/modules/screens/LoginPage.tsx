import React, { useState, useRef } from 'react';
import { useAuth, UserRole } from '../state/AuthContext';
import { ThreeDBackground } from '../components/ThreeDBackground';
import { 
    SparklesIcon, AcademicCapIcon, ShieldCheckIcon, 
    LockClosedIcon, EnvelopeIcon, ArrowRightIcon,
    CubeTransparentIcon, CpuChipIcon, BoltIcon, EyeIcon, EyeSlashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [roleTab, setRoleTab] = useState<UserRole>('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // 3D Card Tilt State
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [tilt, setTilt] = useState({ rx: 0, ry: 0, glowX: 50, glowY: 50 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate 3D tilt angles (max ~10 degrees)
        const rx = -((y - centerY) / centerY) * 10;
        const ry = ((x - centerX) / centerX) * 10;
        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;

        setTilt({ rx, ry, glowX, glowY });
    };

    const handleMouseLeave = () => {
        setTilt({ rx: 0, ry: 0, glowX: 50, glowY: 50 });
    };

    const handleRoleSelect = (role: UserRole) => {
        setRoleTab(role);
        // Clear fields on tab change for security
        setEmail('');
        setPassword('');
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            toast.error('Please enter your email and password');
            return;
        }

        setIsLoading(true);
        try {
            const success = await login(email.trim(), password, roleTab);
            if (!success) {
                toast.error('Invalid credentials. Access denied.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Quick Guest access
    const handleStudentGuestAccess = async () => {
        setIsLoading(true);
        try {
            await login('pawasesahil2004@gmail.com', 'Sahil2004&&', 'student');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAutofill = () => {
        setEmail('pawasesahil2004@gmail.com');
        setPassword('Sahil2004&&');
        toast.success('Credentials filled for Sahil Pawase');
    };

    const isStudent = roleTab === 'student';

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#06080F] relative overflow-hidden select-none">
            {/* 1. Full 3D Interactive WebGL/Canvas Particle Universe */}
            <ThreeDBackground role={roleTab} />

            {/* 2. Ambient Dynamic Volumetric Lights */}
            <div 
                className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${
                    isStudent ? 'bg-cyan-500/15' : 'bg-purple-600/20'
                }`}
            />
            <div 
                className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${
                    isStudent ? 'bg-emerald-500/15' : 'bg-pink-600/20'
                }`}
            />

            {/* 3. Top Floating 3D Navigation HUD */}
            <div className="absolute top-6 inset-x-0 max-w-5xl mx-auto px-6 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl p-[1px] shadow-lg flex items-center justify-center transition-all duration-500 ${
                        isStudent 
                            ? 'bg-gradient-to-tr from-cyan-400 to-emerald-400 shadow-cyan-500/20' 
                            : 'bg-gradient-to-tr from-purple-500 to-pink-500 shadow-purple-500/20'
                    }`}>
                        <div className="w-full h-full bg-slate-950/90 backdrop-blur-md rounded-[15px] flex items-center justify-center">
                            <SparklesIcon className={`w-5 h-5 ${isStudent ? 'text-cyan-400' : 'text-purple-400'}`} />
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                            CLARIVO
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                            ENTERPRISE DATA & AI DECISION INTELLIGENCE
                        </div>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/70 border border-white/10 text-[11px] text-slate-300 backdrop-blur-md shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>PostgreSQL / SQLite Connected</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/70 border border-white/10 text-[11px] text-slate-300 backdrop-blur-md shadow-inner">
                        <CubeTransparentIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Security Enforced</span>
                    </div>
                </div>
            </div>

            {/* 4. Main 3D Card Container with Parallax Tilt */}
            <div 
                className="w-full max-w-[440px] z-10 transition-transform duration-150 ease-out"
                style={{ perspective: '1200px' }}
            >
                <div
                    ref={cardRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(10px)`,
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.15s ease-out, box-shadow 0.3s ease'
                    }}
                    className={`relative rounded-3xl p-8 backdrop-blur-2xl border transition-colors duration-500 shadow-2xl ${
                        isStudent
                            ? 'bg-slate-950/75 border-cyan-500/20 shadow-cyan-950/40'
                            : 'bg-slate-950/75 border-purple-500/20 shadow-purple-950/40'
                    }`}
                >
                    {/* Dynamic Specular Light Glare following cursor */}
                    <div 
                        className="absolute inset-0 rounded-3xl pointer-events-none opacity-40 transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, ${
                                isStudent ? 'rgba(56, 189, 248, 0.25)' : 'rgba(168, 85, 247, 0.25)'
                            } 0%, transparent 60%)`
                        }}
                    />

                    {/* Brand Card Header */}
                    <div className="text-center mb-6" style={{ transform: 'translateZ(30px)' }}>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 mb-3 shadow-inner">
                            <CpuChipIcon className={`w-3.5 h-3.5 ${isStudent ? 'text-cyan-400' : 'text-purple-400'}`} />
                            <span className="font-medium">Clarivo Portal v1.0</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Welcome to <span className={`text-transparent bg-clip-text ${
                                isStudent 
                                    ? 'bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400'
                                    : 'bg-gradient-to-r from-purple-400 via-violet-300 to-pink-400'
                            }`}>Clarivo</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            {isStudent 
                                ? 'Data Analyst Workspace • Interactive BI & Gemini Intelligence' 
                                : 'Admin Security Console • Restricted Access'}
                        </p>
                    </div>

                    {/* Role Tab Selector */}
                    <div 
                        className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-900/80 rounded-2xl border border-white/5 mb-5 shadow-inner"
                        style={{ transform: 'translateZ(20px)' }}
                    >
                        <button
                            type="button"
                            onClick={() => handleRoleSelect('student')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 ${
                                isStudent
                                    ? 'bg-gradient-to-r from-cyan-500/25 to-emerald-500/25 text-cyan-200 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <AcademicCapIcon className={`w-4 h-4 ${isStudent ? 'text-cyan-400' : ''}`} />
                            <span>Data Analyst</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleSelect('admin')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 ${
                                !isStudent
                                    ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <ShieldCheckIcon className={`w-4 h-4 ${!isStudent ? 'text-purple-400' : ''}`} />
                            <span>Admin Console</span>
                        </button>
                    </div>

                    {/* Active Mode Info Chip with Quick Autofill Button */}
                    <div 
                        className={`mb-5 p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 transition-all duration-300 ${
                            isStudent
                                ? 'bg-cyan-950/30 border-cyan-500/25 text-cyan-200'
                                : 'bg-purple-950/30 border-purple-500/25 text-purple-200'
                        }`}
                        style={{ transform: 'translateZ(15px)' }}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <div className={`w-2 h-2 rounded-full shrink-0 animate-ping ${isStudent ? 'bg-cyan-400' : 'bg-purple-400'}`} />
                            <span className="truncate">
                                {isStudent
                                    ? 'Interactive BI Studio & Gemini Copilot'
                                    : 'Security Enforced: Admin credentials required'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleQuickAutofill}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all shrink-0 ${
                                isStudent
                                    ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30'
                                    : 'bg-purple-500/20 border-purple-400/40 text-purple-300 hover:bg-purple-500/30'
                            }`}
                            title="Fill pawasesahil2004@gmail.com credentials"
                        >
                            Autofill Sahil
                        </button>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleFormSubmit} className="space-y-4" style={{ transform: 'translateZ(25px)' }}>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                {isStudent ? 'Analyst / Work Email' : 'Admin Email'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                    <EnvelopeIcon className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="pawasesahil2004@gmail.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/60 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                    <LockClosedIcon className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/60 transition-all font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                                isStudent
                                    ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-semibold shadow-cyan-500/25'
                                    : 'bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-purple-600/30'
                            }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Sign In to {isStudent ? 'Analyst Workspace' : 'Admin Console'}</span>
                                    <ArrowRightIcon className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Student Guest Preview Option (Admin is strictly credentials-only) */}
                    {isStudent && (
                        <div className="mt-4 pt-4 border-t border-white/10 text-center" style={{ transform: 'translateZ(20px)' }}>
                            <button
                                type="button"
                                onClick={handleStudentGuestAccess}
                                disabled={isLoading}
                                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
                            >
                                <AcademicCapIcon className="w-4 h-4 text-cyan-400" />
                                <span>Continue as Data Analyst (Explore Datasets & AI Studio)</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Security Badges */}
                <div className="flex items-center justify-center gap-4 text-center text-[11px] text-slate-400 mt-5">
                    <span className="flex items-center gap-1">
                        <BoltIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>Role-Based Access</span>
                    </span>
                    <span>•</span>
                    <span>Neon PostgreSQL</span>
                    <span>•</span>
                    <span>Encrypted Auth</span>
                </div>
            </div>
        </div>
    );
};
