import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent' | 'admin';
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post('/api/auth/signin', { email, password });
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const data = await api.post('/api/auth/signup', { name, email, password });
    setUser(data.user);
  };

  const logout = async () => {
    await api.post('/api/auth/signout', {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
