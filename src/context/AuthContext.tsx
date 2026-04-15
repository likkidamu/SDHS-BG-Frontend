import React, { createContext, useContext, useEffect, useState } from 'react';
import storage from '../services/storage';
import api from '../services/api';

interface User {
  volunteerId: string;
  name: string;
  role: string;
  groupId: string;
  defaultPassword: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (volunteerId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved session on app start
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await storage.getItem('token');
        const savedUser = await storage.getItem('user');
        if (savedToken && savedUser) {
          const parsed = JSON.parse(savedUser);
          parsed.defaultPassword = parsed.defaultPassword === true || parsed.defaultPassword === 'true';
          setToken(savedToken);
          setUser(parsed);
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (volunteerId: string, password: string) => {
    const res = await api.post('/auth/login', { volunteerId, password });
    const data = res.data;

    const defaultPassword = data.defaultPassword === true || data.defaultPassword === 'true';

    await storage.setItem('token', data.token);
    await storage.setItem('user', JSON.stringify({
      volunteerId: data.volunteerId,
      name: data.name,
      role: data.role,
      groupId: data.groupId,
      defaultPassword,
    }));

    setToken(data.token);
    setUser({
      volunteerId: data.volunteerId,
      name: data.name,
      role: data.role,
      groupId: data.groupId,
      defaultPassword,
    });
  };

  const logout = async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
