import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, supabase, verifyPassword } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastActivity, setLastActivity] = useState(Date.now());

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('tawseel_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('tawseel_user');
            }
        }
        setLoading(false);
    }, []);

    // Inactivity timeout (10 minutes)
    useEffect(() => {
        if (!user) return;

        const handleActivity = () => {
            setLastActivity(Date.now());
        };

        const checkInactivity = setInterval(() => {
            const now = Date.now();
            const inactiveTime = now - lastActivity;
            const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

            if (inactiveTime >= tenMinutes) {
                logout();
            }
        }, 60000); // Check every minute

        // Track user activity
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        return () => {
            clearInterval(checkInactivity);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [user, lastActivity]);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            // Fetch user from database
            const { data: users, error } = await supabase
                .from('users')
                .select(`
          *,
          role:roles(*)
        `)
                .eq('email', email.toLowerCase())
                .single();

            if (error || !users) {
                console.error('User not found:', error);
                return false;
            }

            // Check if account is disabled
            if (users.disabled) {
                alert('هذا الحساب معطل. يرجى التواصل مع الإدارة.');
                return false;
            }

            // Verify password
            const isValid = await verifyPassword(password, users.password);
            if (!isValid) {
                return false;
            }

            // Store user
            setUser(users);
            localStorage.setItem('tawseel_user', JSON.stringify(users));
            setLastActivity(Date.now());
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('tawseel_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
