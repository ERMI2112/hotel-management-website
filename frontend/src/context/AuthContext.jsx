import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('hotel_token');
    const savedUser = localStorage.getItem('hotel_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('hotel_token');
        localStorage.removeItem('hotel_user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const result = await apiLogin({ email, password });
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem('hotel_token', result.token);
    localStorage.setItem('hotel_user', JSON.stringify(result.user));
    return result;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hotel_token');
    localStorage.removeItem('hotel_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isOwner: user?.role === 'owner' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
