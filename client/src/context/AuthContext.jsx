import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user session on app start via GET /auth/me
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const currentUser = await apiClient('/auth/me');
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Register new user and update session
  const signup = async (nameOrData, maybeEmail, maybePassword) => {
    const payload =
      typeof nameOrData === 'object'
        ? nameOrData
        : { name: nameOrData, email: maybeEmail, password: maybePassword };

    const data = await apiClient('/auth/register', {
      method: 'POST',
      body: payload,
    });

    setUser(data);
    return data;
  };

  // Login existing user and update session
  const login = async (emailOrData, maybePassword) => {
    const payload =
      typeof emailOrData === 'object'
        ? emailOrData
        : { email: emailOrData, password: maybePassword };

    const data = await apiClient('/auth/login', {
      method: 'POST',
      body: payload,
    });

    setUser(data);
    return data;
  };

  // Logout user and clear session
  const logout = async () => {
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
      });
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
