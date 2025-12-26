import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tenantId, setTenantId] = useState(localStorage.getItem('tenantId'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }, [token]);

  const login = async ({ email, password, tenant }) => {
    const { data } = await api.post('/api/v1/auth/login', { email, password, tenantId: tenant });
    setUser(data.user);
    setToken(data.token);
    setTenantId(tenant);
    localStorage.setItem('token', data.token);
    localStorage.setItem('tenantId', tenant);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
  };

  return <AuthContext.Provider value={{ user, token, tenantId, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
