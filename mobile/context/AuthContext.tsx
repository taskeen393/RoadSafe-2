import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services';
import { userService } from '../services';
import { User } from '../services/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from SecureStore on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await authService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.log('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (token: string, userData: User) => {
    try {
      await authService.saveAuthCredentials(token, userData);
      setUser(userData);
    } catch (error) {
      console.log('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.log('Error during logout:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      // Try to get fresh data from backend first (includes latest profileImage)
      try {
        const { user: freshUser } = await userService.getProfile();
        if (freshUser) {
          setUser(freshUser);
          return;
        }
      } catch {
        // Fall back to SecureStore if backend request fails
      }
      const storedUser = await authService.getCurrentUser();
      setUser(storedUser);
    } catch (error) {
      console.log('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
