import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, fetchMe } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('erp_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists, re-validate it against /auth/me so a
  // stale/expired token doesn't leave the UI thinking it's still logged in.
  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem('erp_user', JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedInUser } = await loginApi(email, password);
    localStorage.setItem('erp_token', token);
    localStorage.setItem('erp_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => !!user && roles.includes(user.role), [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
