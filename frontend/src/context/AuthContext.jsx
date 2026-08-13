import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const DEMO_USERS = {
  CUSTOMER: { email: 'customer@quickbite.com', password: 'password123', label: 'Customer (Rahul Verma)' },
  RESTAURANT: { email: 'owner@quickbite.com', password: 'password123', label: 'Restaurant Owner (Chef Sanjeev)' },
  DELIVERY: { email: 'delivery@quickbite.com', password: 'password123', label: 'Delivery Partner (Aarav Patel)' },
  ADMIN: { email: 'admin@quickbite.com', password: 'password123', label: 'Platform Admin (Rajesh Kumar)' }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('qb_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then(res => {
          if (res.success) setUser(res.user);
          else logout();
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      quickLogin('CUSTOMER').finally(() => setLoading(false));
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      localStorage.setItem('qb_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
  };

  const quickLogin = async (roleKey) => {
    const creds = DEMO_USERS[roleKey];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    localStorage.removeItem('qb_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
