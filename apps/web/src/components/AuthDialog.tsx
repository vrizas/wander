'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ErrorMsg } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import type { AuthMode } from '@/lib/auth-modal';

export function AuthDialog({
  open,
  initialMode,
  next,
  reason,
  onOpenChange,
}: {
  open: boolean;
  initialMode: AuthMode;
  next?: string;
  reason?: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 rounded-3xl p-6 sm:max-w-sm sm:p-8">
        {open ? <AuthForm key={initialMode} initialMode={initialMode} next={next} reason={reason} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function AuthForm({ initialMode, next, reason, onDone }: { initialMode: AuthMode; next?: string; reason?: string; onDone: () => void }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = isLogin ? await login(form.email, form.password) : await register(form.name, form.email, form.password);
      toast.success(isLogin ? `Halo, ${user.name}` : 'Akun berhasil dibuat');
      onDone();
      if (next) router.push(next);
      else if (user.role === 'ADMIN') router.push('/admin');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader className="space-y-1.5 text-center sm:text-center">
        <DialogTitle className="font-heading text-2xl font-light tracking-[0.1em] uppercase">{isLogin ? 'Masuk' : 'Daftar'}</DialogTitle>
        <DialogDescription>
          {reason ?? (isLogin ? 'Masuk untuk checkout dan melihat pesanan Anda.' : 'Buat akun untuk mulai berbelanja.')}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMsg>{error}</ErrorMsg>
        {!isLogin && (
          <div className="space-y-1.5">
            <Label htmlFor="auth-name">Nama</Label>
            <Input id="auth-name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="auth-email">Email</Label>
          <Input id="auth-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            minLength={isLogin ? undefined : 6}
            placeholder={isLogin ? undefined : 'Min. 6 karakter'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <Button size="lg" className="w-full" disabled={busy}>
          {busy ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button
            type="button"
            className="font-medium text-foreground underline"
            onClick={() => {
              setMode(isLogin ? 'register' : 'login');
              setError(null);
            }}
          >
            {isLogin ? 'Daftar' : 'Masuk'}
          </button>
        </p>
      </form>
    </>
  );
}
