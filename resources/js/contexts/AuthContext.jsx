import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token and user are persisted in localStorage
    const savedToken = localStorage.getItem('sirkel_token');
    const savedUser = localStorage.getItem('sirkel_user');

    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      if (data.success) {
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const registerUmkm = async (regData) => {
    setLoading(true);
    try {
      const data = await authService.registerUmkm(regData);
      if (data.success) {
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const registerSupplier = async (regData) => {
    setLoading(true);
    try {
      const data = await authService.registerSupplier(regData);
      if (data.success) {
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('sirkel_user', JSON.stringify(currentUser));
    } catch (error) {
      setUser(null);
      localStorage.removeItem('sirkel_token');
      localStorage.removeItem('sirkel_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerUmkm, registerSupplier, logout, checkAuth }}>
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
