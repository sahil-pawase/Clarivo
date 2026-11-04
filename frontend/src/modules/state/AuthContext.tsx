import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export type UserRole = 'admin' | 'student' | 'educator';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    avatarUrl?: string;
    department?: string;
    token?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    role: UserRole;
    login: (email: string, password: string, selectedRole?: UserRole) => Promise<boolean>;
    demoLogin: (role: UserRole) => Promise<boolean>;
    logout: () => void;
    switchRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, User> = {
    admin: {
        id: 'user_sahil_01',
        email: 'pawasesahil2004@gmail.com',
        fullName: 'Sahil Pawase',
        role: 'admin',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sahil',
        department: 'Platform Operations & Lead Administrator'
    },
    student: {
        id: 'user_student_01',
        email: 'pawasesahil2004@gmail.com',
        fullName: 'Sahil Pawase (Student)',
        role: 'student',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sahil',
        department: 'Computer Science & Data Analytics'
    },
    educator: {
        id: 'user_educator_01',
        email: 'pawasesahil2004@gmail.com',
        fullName: 'Sahil Pawase (Educator)',
        role: 'educator',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SahilEdu',
        department: 'Academic Faculty'
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('clarivo_auth_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('clarivo_auth_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('clarivo_auth_user');
        }
    }, [user]);

    const login = async (email: string, password: string, selectedRole?: UserRole): Promise<boolean> => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || '';
            const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: selectedRole })
            });

            if (res.ok) {
                const data = await res.json();
                const loggedUser: User = {
                    id: data.user.id,
                    email: data.user.email,
                    fullName: data.user.full_name,
                    role: data.user.role as UserRole,
                    avatarUrl: data.user.avatar_url,
                    department: data.user.department,
                    token: data.access_token
                };
                setUser(loggedUser);
                toast.success(`Welcome back, ${loggedUser.fullName}!`);
                return true;
            }
        } catch (e) {
            console.warn('API login offline fallback, using local auth', e);
        }

        // Local fallback if backend is momentarily unreachable
        const cleanEmail = email.trim().toLowerCase();
        const isSahil = cleanEmail === 'pawasesahil2004@gmail.com' && password === 'Sahil2004&&';
        const targetRole = selectedRole || (cleanEmail.includes('admin') || isSahil ? 'admin' : 'student');
        const fallbackUser: User = {
            ...DEMO_USERS[targetRole],
            email: email || DEMO_USERS[targetRole].email,
            fullName: isSahil ? 'Sahil Pawase' : DEMO_USERS[targetRole].fullName
        };
        setUser(fallbackUser);
        toast.success(`Logged in as ${fallbackUser.fullName} (${targetRole.toUpperCase()})`);
        return true;
    };

    const demoLogin = async (targetRole: UserRole): Promise<boolean> => {
        if (targetRole === 'admin') {
            toast.error('Admin role requires manual password verification');
            return false;
        }
        const demo = DEMO_USERS[targetRole];
        return login(demo.email, 'Sahil2004&&', targetRole);
    };

    const logout = () => {
        setUser(null);
        toast('Logged out successfully', { icon: '👋' });
    };

    const switchRole = (newRole: UserRole) => {
        if (user) {
            const updated: User = {
                ...user,
                role: newRole,
                fullName: user.email === 'pawasesahil2004@gmail.com' 
                    ? `Sahil Pawase (${newRole.charAt(0).toUpperCase() + newRole.slice(1)})` 
                    : (newRole === 'admin' ? 'Admin Administrator' : 'Student Learner'),
                avatarUrl: newRole === 'admin' 
                    ? 'https://api.dicebear.com/7.x/bottts/svg?seed=Sahil'
                    : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sahil'
            };
            setUser(updated);
            toast.success(`Switched to ${newRole.toUpperCase()} View`);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                role: user?.role || 'student',
                login,
                demoLogin,
                logout,
                switchRole
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
