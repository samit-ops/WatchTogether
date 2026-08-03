import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '@/services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async (isRetry = false) => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await authService.getCurrentUser();
          setUser(data.user);
        } catch (error) {
          console.error('Failed to load user', error);
          // If it's a timeout or network error (server waking up on free tier), retry once
          if (!isRetry && (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || !error.response)) {
            setTimeout(() => initAuth(true), 3000);
            return;
          }
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (name, email, password, phoneNumber, city, pincode) => {
    const data = await authService.register(name, email, password, phoneNumber, city, pincode);
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const setAuthSession = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = async () => {
    await authService.logout().catch(() => {});
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const data = await authService.getCurrentUser();
        setUser(data.user);
      } catch (error) {
        console.error('Failed to refresh user', error);
      }
    }
  };

  const updateUserSubscription = (newPlan) => {
    setUser(prev => prev ? { ...prev, subscription: newPlan } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateUserSubscription, setAuthSession }}>
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
