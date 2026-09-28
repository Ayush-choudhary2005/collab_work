import { createContext, useCallback, useMemo, useState } from 'react';
import api, { clearSession, getStoredUser, setStoredUser, setToken, STORAGE_KEYS } from '../services/api';

export const AuthContext = createContext(null);

// Read the saved session synchronously on first render, so a page refresh
// never flashes the login screen. A half-saved session (token without user,
// or vice versa) is treated as logged out and wiped.
const readSession = () => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const user = getStoredUser();
  if (token && user) return { token, user };
  clearSession();
  return { token: null, user: null };
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user } = data.data;
    setToken(data.token);
    setStoredUser(user);
    setSession({ token: data.token, user });
  }, []);

  // The API's register endpoint only creates the account (no token), so
  // sign the user straight in afterwards.
  const register = useCallback(
    async ({ fullName, email, password }) => {
      await api.post('/auth/register', { fullName, email, password });
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    clearSession();
    setSession({ token: null, user: null });
  }, []);

  const value = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token),
      login,
      register,
      logout,
    }),
    [session, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
