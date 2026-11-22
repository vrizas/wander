'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { AuthModalProvider } from '@/lib/auth-modal';
import { CartProvider } from '@/lib/cart';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <CartProvider>{children}</CartProvider>
      </AuthModalProvider>
    </AuthProvider>
  );
}
