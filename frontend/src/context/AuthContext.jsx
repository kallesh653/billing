import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    // Use sessionStorage - clears when browser/app closes
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const { data } = await api.post('/auth/login', { username, password });

      // Use sessionStorage - requires login on each app start
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
