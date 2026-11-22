'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { RequireLogin } from '@/components/RequireLogin';
import { OrderDetailSkeleton } from '@/components/skeletons';
import { ErrorMsg, StatusBadge } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { api, rupiah, type Order } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { startPayment, syncPayment } from '@/lib/pay';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { token, ready, user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      let current = await api<Order>(`/orders/${id}`, { token });
      if (current.status === 'PENDING') {
        const synced = await syncPayment(id, token);
        if (synced && synced.status !== current.status) current = await api<Order>(`/orders/${id}`, { token });
      }
      setOrder(current);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (order?.status !== 'PENDING') return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [order?.status, load]);

  async function pay() {
    if (!token || !order) return;
    setBusy(true);
    setError(null);
    try {
      await startPayment(order.id, token, (p) => router.push(p));
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <OrderDetailSkeleton />;
  if (!user) return <RequireLogin message="Masuk untuk melihat pesanan." next={`/orders/${id}`} />;
  if (error && !order) return <ErrorMsg>{error}</ErrorMsg>;
  if (!order) return <OrderDetailSkeleton />;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/orders" className="text-sm text-muted-foreground hover:underline">
        ← Semua pesanan
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xl font-semibold">{order.code}</h1>
        <StatusBadge status={order.status} />
      </div>
      <ErrorMsg>{error}</ErrorMsg>
      <Card className="gap-0 py-0">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between border-b p-4 text-sm">
            <span>
              {i.name} x {i.quantity}
            </span>
            <span>{rupiah(i.price * i.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between p-4 text-sm text-muted-foreground">
          <span>Ongkir</span>
          <span>{rupiah(order.shippingCost)}</span>
        </div>
        <Separator />
        <div className="flex justify-between p-4 font-semibold">
          <span>Total</span>
          <span>{rupiah(order.total)}</span>
        </div>
      </Card>
      <Card>
        <CardContent className="text-sm">
          <p className="font-medium">Dikirim ke</p>
          <p className="text-muted-foreground">{order.shippingAddress}</p>
        </CardContent>
      </Card>
      {order.status === 'PENDING' && (
        <Button size="lg" onClick={pay} disabled={busy}>
          {busy ? 'Memproses...' : 'Bayar sekarang'}
        </Button>
      )}
      {order.status === 'PAID' && <p className="text-sm text-emerald-700">Pembayaran diterima. Konfirmasi dikirim ke email Anda.</p>}
    </div>
  );
}
