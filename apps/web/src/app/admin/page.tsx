'use client';

import { useEffect, useState } from 'react';
import { StatsSkeleton } from '@/components/skeletons';
import { ErrorMsg } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, rupiah, type DashboardStats } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<DashboardStats>('/dashboard', { token })
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, [token]);

  if (error) return <ErrorMsg>{error}</ErrorMsg>;
  if (!stats) return <StatsSkeleton />;

  const cards = [
    { label: 'Pendapatan (lunas)', value: rupiah(stats.revenue) },
    { label: 'Total order', value: stats.orders.total },
    { label: 'Menunggu pembayaran', value: stats.orders.PENDING },
    { label: 'Order lunas', value: stats.orders.PAID },
    { label: 'Produk aktif', value: stats.productCount },
    { label: 'Stok menipis (maks. 5)', value: stats.lowStockCount, warn: stats.lowStockCount > 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-light tracking-[0.1em] uppercase">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="gap-1 py-4">
            <CardHeader className="pb-0">
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardHeader>
            <CardContent>
              <p className={cn('text-2xl font-semibold', c.warn && 'text-amber-600')}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Produk terlaris</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penjualan.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {stats.topProducts.map((p) => (
                <li key={p.name} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">{p.sold} terjual</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
