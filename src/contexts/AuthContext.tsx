'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    email: string;
    name: string;
    roles: {
        is_sales_associate: boolean;
        is_quote_manager: boolean;
        is_purchase_manager: boolean;
        is_admin: boolean;
    };
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    hasRole: (role: keyof User['roles']) => boolean;
    hasAnyRole: (roles: (keyof User['roles'])[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check authentication status on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                // Alternative: Re-check auth status to ensure consistency
                await checkAuth();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setUser(null);
            router.push('/login');
        }
    };

    const hasRole = (role: keyof User['roles']): boolean => {
        return user?.roles[role] || false;
    };

    const hasAnyRole = (roles: (keyof User['roles'])[]): boolean => {
        return roles.some(role => user?.roles[role]);
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        hasRole,
        hasAnyRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// HOC for protecting pages
export function withAuthPage<T extends {}>(
    WrappedComponent: React.ComponentType<T>,
    requiredRoles?: (keyof User['roles'])[]
) {
    return function ProtectedPage(props: T) {
        const { user, isLoading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!isLoading) {
                if (!user) {
                    router.push('/login');
                    return;
                }

                if (requiredRoles && !requiredRoles.some(role => user.roles[role])) {
                    router.push('/unauthorized');
                    return;
                }
            }
        }, [user, isLoading, router]);

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-lg">Loading...</div>
                </div>
            );
        }

        if (!user) {
            return null; // Will redirect to login
        }

        if (requiredRoles && !requiredRoles.some(role => user.roles[role])) {
            return null; // Will redirect to unauthorized
        }

        return <WrappedComponent {...props} />;
    };
}
