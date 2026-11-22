'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthModal } from '@/lib/auth-modal';

export function RequireLogin({ message, next, reason }: { message: string; next: string; reason?: string }) {
  const { openAuth } = useAuthModal();
  useEffect(() => {
    openAuth({ next, reason: reason ?? message });
  }, [openAuth, next, reason, message]);

  return (
    <div className="py-16 text-center">
      <p className="text-muted-foreground">{message}</p>
      <Button className="mt-4" onClick={() => openAuth({ next, reason: reason ?? message })}>
        Masuk
      </Button>
    </div>
  );
}
