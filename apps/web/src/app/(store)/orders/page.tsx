'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireLogin } from '@/components/RequireLogin';
import { ListSkeleton } from '@/components/skeletons';
import { ErrorMsg, StatusBadge } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { api, rupiah, type Order } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function OrdersPage() {
  const { token, ready, user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<Order[]>('/orders/me', { token })
      .then(setOrders)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  if (!ready) return <ListSkeleton />;
  if (!user) return <RequireLogin message="Masuk untuk melihat pesanan Anda." next="/orders" />;

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-light tracking-[0.1em] uppercase">Pesanan saya</h1>
      <ErrorMsg>{error}</ErrorMsg>
      {!orders && !error && <ListSkeleton />}
      {orders?.length === 0 && <p className="text-muted-foreground">Belum ada pesanan.</p>}
      {orders?.map((o) => (
        <Link key={o.id} href={`/orders/${o.id}`} className="block">
          <Card className="flex-row items-center justify-between gap-4 p-4 transition hover:shadow-sm">
            <div>
              <p className="font-mono text-sm">{o.code}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(o.createdAt).toLocaleString('id-ID')}, {o.items.length} produk
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="font-semibold">{rupiah(o.total)}</p>
              <StatusBadge status={o.status} />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
