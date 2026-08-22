import React, { createContext, useContext, useEffect, useState } from 'react';
import storage from '../services/storage';
import api, { setUnauthorizedHandler } from '../services/api';

interface ProfileResponse {
  volunteerId: string;
  name: string;
  role: string;
  groupId: string | null;
}

interface User {
  volunteerId: string;
  name: string;
  role: string;
  groupId: string | null;
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

  const clearSession = () => {
    setToken(null);
    setUser(null);
  };

  // Restore identity from the backend. Cached user data is never trusted.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);

    (async () => {
      try {
        const savedToken = await storage.getItem('token');
        await storage.removeItem('user');
        if (savedToken) {
          const response = await api.get<ProfileResponse>('/profile');
          const profile = response.data;
          setToken(savedToken);
          setUser({
            volunteerId: profile.volunteerId,
            name: profile.name,
            role: profile.role,
            groupId: profile.groupId,
            defaultPassword: false,
          });
        }
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    })();

    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (volunteerId: string, password: string) => {
    const res = await api.post('/auth/login', { volunteerId, password });
    const data = res.data;

    const defaultPassword = data.defaultPassword === true || data.defaultPassword === 'true';

    await storage.setItem('token', data.token);
    await storage.removeItem('user');

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
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
