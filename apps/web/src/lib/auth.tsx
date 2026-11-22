'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type User } from './api';
import { readJSON, writeJSON } from './storage';

interface Session {
  token: string;
  user: User;
}
interface AuthState {
  user: User | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const KEY = 'shop.session';
const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronisasi sekali dari localStorage setelah hidrasi
    setSession(readJSON<Session>(KEY));
    setReady(true);
  }, []);

  const store = useCallback((res: { accessToken: string; user: User }) => {
    const s = { token: res.accessToken, user: res.user };
    setSession(s);
    writeJSON(KEY, s);
    return res.user;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      ready,
      login: async (email, password) =>
        store(await api('/auth/login', { method: 'POST', body: { email, password } })),
      register: async (name, email, password) =>
        store(await api('/auth/register', { method: 'POST', body: { name, email, password } })),
      logout: () => {
        setSession(null);
        writeJSON(KEY, null);
      },
    }),
    [session, ready, store],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
