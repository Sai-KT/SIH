// =============================================================================
// SIH26034 — Auth Context
// =============================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { mockUsers } from '../mock/data';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // Dev helper for demo
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Demo users indexed by role
const demoUsers: Record<UserRole, User> = {
  ADMIN:      mockUsers[0],
  SUPERVISOR: mockUsers[1],
  INSPECTOR:  mockUsers[2],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('sih_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, _password: string) => {
    // Mock login — match by email or accept any with password "demo"
    await new Promise(r => setTimeout(r, 800));
    const found = mockUsers.find(u => u.email === email);
    const loggedIn = found || mockUsers[2]; // Default inspector
    setUser(loggedIn);
    sessionStorage.setItem('sih_user', JSON.stringify(loggedIn));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('sih_user');
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    const u = demoUsers[role];
    setUser(u);
    sessionStorage.setItem('sih_user', JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
