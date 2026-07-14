import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import type { LoginRequest, SignUpRequest, AuthResponse } from '../types/auth';

interface User {
  username: string;
  email: string;
  rating: number;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginData: LoginRequest) => Promise<AuthResponse>;
  register: (signUpData: SignUpRequest) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user session already exists in localStorage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (loginData: LoginRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', loginData);
      const { token: jwt, username, email, rating, role } = response.data;
      
      const userData = { username, email, rating, role };
      
      localStorage.setItem('token', jwt);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(jwt);
      setUser(userData);
      
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (signUpData: SignUpRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await api.post<AuthResponse>('/api/auth/register', signUpData);
      const { token: jwt, username, email, rating, role } = response.data;
      
      const userData = { username, email, rating, role };
      
      localStorage.setItem('token', jwt);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(jwt);
      setUser(userData);
      
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
