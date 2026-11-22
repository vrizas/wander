'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AuthDialog } from '@/components/AuthDialog';

export type AuthMode = 'login' | 'register';
export interface OpenAuthOptions {
  mode?: AuthMode;
  next?: string;
  reason?: string;
}
interface AuthModalState {
  openAuth: (opts?: OpenAuthOptions) => void;
}

const Ctx = createContext<AuthModalState | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(OpenAuthOptions & { open: boolean }) | null>(null);

  const openAuth = useCallback((opts: OpenAuthOptions = {}) => setState({ ...opts, open: true }), []);
  const value = useMemo(() => ({ openAuth }), [openAuth]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <AuthDialog
        open={!!state?.open}
        initialMode={state?.mode ?? 'login'}
        next={state?.next}
        reason={state?.reason}
        onOpenChange={(open) => setState((s) => (s ? { ...s, open } : s))}
      />
    </Ctx.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuthModal must be used inside AuthModalProvider');
  return ctx;
}
