import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Merchant } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  merchant: Merchant | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginDemo: () => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  updateMerchant: (m: Merchant) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('apexgrowth_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const loadSession = async () => {
    const savedToken = localStorage.getItem('apexgrowth_token');
    if (!savedToken) {
      setUser(null);
      setMerchant(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setMerchant(data.merchant || null);
      setToken(savedToken);
    } catch (err) {
      console.warn('Session verification error, clearing invalid token.');
      localStorage.removeItem('apexgrowth_token');
      setUser(null);
      setMerchant(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const res = await api.login(email.trim().toLowerCase(), password);
      localStorage.setItem('apexgrowth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setMerchant(res.merchant || null);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (): Promise<User> => {
    setLoading(true);
    try {
      const res = await api.demoLogin();
      localStorage.setItem('apexgrowth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setMerchant(res.merchant || null);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const res = await api.register(fullName.trim(), email.trim().toLowerCase(), password);
      localStorage.setItem('apexgrowth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setMerchant(res.merchant || null);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('apexgrowth_token');
    setUser(null);
    setMerchant(null);
    setToken(null);
  };

  const updateMerchant = (m: Merchant) => {
    setMerchant(m);
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setMerchant(data.merchant || null);
    } catch (e) {
      console.error(e);
    }
  };

  const isAuthenticated = !!user;
  const isOnboarded = !!user?.is_onboarded;

  return (
    <AuthContext.Provider
      value={{
        user,
        merchant,
        token,
        loading,
        isAuthenticated,
        isOnboarded,
        login,
        loginDemo,
        register,
        logout,
        updateMerchant,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
