import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) return setReady(true);
    api('/me').then((r) => setUser(r.user)).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  const authenticate = async (mode, body) => {
    const r = await api(`/auth/${mode}`, { method: 'POST', body });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  };
  const logout = () => { setToken(null); setUser(null); };

  return <Ctx.Provider value={{ user, ready, authenticate, logout }}>{children}</Ctx.Provider>;
}
