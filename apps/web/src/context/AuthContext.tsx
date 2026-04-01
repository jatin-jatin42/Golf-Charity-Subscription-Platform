'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, saveToken, clearToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUBSCRIBER' | 'ADMIN';
  charityId?: string;
  charityPercent: number;
  subscription?: {
    plan: string;
    status: string;
    renewalDate: string;
    totalAmount: number;
  };
  charity?: { id: string; name: string; imageUrl?: string };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const data = await api.auth.me() as any;
      setUser(data);
    } catch {
      setUser(null);
      clearToken();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data: any = await api.auth.login({ email, password });
    saveToken(data.accessToken);
    setUser(data.user);
    if (data.user.role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const register = async (formData: any) => {
    const data: any = await api.auth.register(formData);
    saveToken(data.accessToken);
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = () => {
    clearToken();
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
