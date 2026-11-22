import { api } from './api';

interface SnapResult {
  snapToken: string;
  redirectUrl: string;
}
interface SnapWindow {
  snap?: {
    pay: (
      token: string,
      cb: { onSuccess?: () => void; onPending?: () => void; onError?: () => void; onClose?: () => void },
    ) => void;
  };
}

export async function syncPayment(orderId: string, token: string) {
  return api<{ status: string }>(`/payments/orders/${orderId}/sync`, { method: 'POST', token }).catch(() => null);
}

export async function startPayment(orderId: string, token: string, navigate: (path: string) => void) {
  const snap = await api<SnapResult>(`/payments/orders/${orderId}/snap`, { method: 'POST', token });
  const w = window as unknown as SnapWindow;
  if (!w.snap) throw new Error('Snap.js is not loaded. Make sure NEXT_PUBLIC_MIDTRANS_CLIENT_KEY is set.');
  await new Promise<void>((resolve) => {
    const done = () => resolve();
    w.snap!.pay(snap.snapToken, { onSuccess: done, onPending: done, onError: done, onClose: done });
  });
  await syncPayment(orderId, token);
  navigate(`/orders/${orderId}`);
}
