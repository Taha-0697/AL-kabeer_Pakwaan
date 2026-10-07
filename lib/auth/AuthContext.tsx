'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  hasPermission: (key: string) => boolean;
  canAccessScreen: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasPermission: () => false,
  canAccessScreen: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch ONCE at app startup – all PermissionGuard components share this
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => { if (data.success) setUser(data.data); })
      .catch((e) => console.error('Auth error', e))
      .finally(() => setLoading(false));
  }, []);

  const hasPermission = (key: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions.includes(key);
  };

  const canAccessScreen = (path: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    const screenMap: Record<string, string> = {
      '/': 'screen:dashboard',
      '/bookings': 'screen:bookings',
      '/bookings/new': 'action:booking_create',
      '/clients': 'screen:clients',
      '/menu': 'screen:menu',
      '/menu/new': 'action:menu_create',
      '/deals': 'screen:deals',
      '/inventory': 'screen:inventory',
      '/crockery': 'screen:crockery',
      '/cashbook': 'screen:cashbook',
      '/employees': 'screen:employees',
      '/users': 'screen:users',
      '/roles': 'screen:roles',
      '/payroll': 'screen:payroll',
      '/settings': 'screen:settings',
    };
    const required = screenMap[path];
    if (!required) return true;
    return hasPermission(required);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasPermission, canAccessScreen }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
