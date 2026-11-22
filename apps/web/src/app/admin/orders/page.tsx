'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/skeletons';
import { ErrorMsg, StatusBadge } from '@/components/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, rupiah, type Order, type OrderStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const FILTERS: { value: 'ALL' | OrderStatus; label: string }[] = [
  { value: 'ALL', label: 'Semua status' },
  { value: 'PENDING', label: 'Menunggu pembayaran' },
  { value: 'PAID', label: 'Lunas' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [status, setStatus] = useState<'ALL' | OrderStatus>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<Order | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setOrders(await api<Order[]>(`/orders${status !== 'ALL' ? `?status=${status}` : ''}`, { token }));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [token, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function cancel(o: Order) {
    try {
      await api(`/orders/${o.id}/status`, { method: 'PATCH', token, body: { status: 'CANCELLED' } });
      toast.success(`Order ${o.code} dibatalkan, stok dikembalikan`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-light tracking-[0.1em] uppercase">Order</h1>
        <Select value={status} onValueChange={(v) => setStatus(v as 'ALL' | OrderStatus)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ErrorMsg>{error}</ErrorMsg>
      {!orders && !error && <TableSkeleton cols={6} />}
      {orders?.length === 0 && <p className="text-muted-foreground">Tidak ada order.</p>}
      {orders && orders.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="align-top">
                    <p className="font-mono font-medium">{o.code}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString('id-ID')}</p>
                  </TableCell>
                  <TableCell className="align-top">
                    <p>{o.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{o.user?.email}</p>
                  </TableCell>
                  <TableCell className="align-top whitespace-normal">
                    <ul>
                      {o.items.map((i) => (
                        <li key={i.id}>
                          {i.name} x {i.quantity}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-xs text-muted-foreground">Alamat: {o.shippingAddress}</p>
                  </TableCell>
                  <TableCell className="text-right align-top font-semibold">{rupiah(o.total)}</TableCell>
                  <TableCell className="align-top">
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right align-top">
                    {o.status === 'PENDING' && (
                      <Button variant="destructive" size="sm" onClick={() => setToCancel(o)}>
                        Batalkan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan order {toCancel?.code}?</AlertDialogTitle>
            <AlertDialogDescription>Stok produk dalam order ini akan dikembalikan. Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (toCancel) void cancel(toCancel);
              }}
            >
              Ya, batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
