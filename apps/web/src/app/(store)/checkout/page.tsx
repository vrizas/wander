'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { RequireLogin } from '@/components/RequireLogin';
import { CheckoutSkeleton } from '@/components/skeletons';
import { ErrorMsg } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { api, rupiah, type Order, type Region } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { startPayment } from '@/lib/pay';

export default function CheckoutPage() {
  const { user, token, ready } = useAuth();
  const { items, subtotal, clear } = useCart();
  const router = useRouter();

  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [regency, setRegency] = useState('');
  const [address, setAddress] = useState('');
  const [shipping, setShipping] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Region[]>('/regions/provinces')
      .then(setProvinces)
      .catch((e: Error) => setRegionError(e.message));
  }, []);

  async function onProvince(id: string) {
    setProvinceId(id);
    setRegency('');
    setRegencies([]);
    setShipping(null);
    if (!id) return;
    try {
      const [regs, ship] = await Promise.all([
        api<Region[]>(`/regions/provinces/${id}/regencies`),
        api<{ cost: number }>(`/regions/shipping-estimate?provinceId=${id}`),
      ]);
      setRegencies(regs);
      setShipping(ship.cost);
    } catch (e) {
      setRegionError((e as Error).message);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    let orderId: string | null = null;
    try {
      const provinceName = provinces.find((p) => p.id === provinceId)?.name ?? '';
      const order = await api<Order>('/orders', {
        method: 'POST',
        token,
        body: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress: `${address}, ${regency}, ${provinceName}`,
          provinceId,
        },
      });
      orderId = order.id;
      clear();
      await startPayment(order.id, token, (path) => router.push(path));
    } catch (err) {
      if (orderId) {
        toast.error(`Could not start the payment: ${(err as Error).message}`);
        router.push(`/orders/${orderId}`);
      } else {
        setError((err as Error).message);
        setBusy(false);
      }
    }
  }

  if (!ready) return <CheckoutSkeleton />;
  if (!user) return <RequireLogin message="Silakan masuk untuk melanjutkan checkout." next="/checkout" />;
  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Keranjang kosong.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/">Lihat produk</Link>
        </Button>
      </div>
    );
  }

  const total = subtotal + (shipping ?? 0);

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-light tracking-[0.1em] uppercase">Checkout</h1>
        <ErrorMsg>{error}</ErrorMsg>
        <ErrorMsg>{regionError}</ErrorMsg>
        <Card>
          <CardHeader>
            <CardTitle>Alamat pengiriman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Provinsi</Label>
              <Select value={provinceId} onValueChange={onProvince}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih provinsi" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kota/kabupaten</Label>
              <Select value={regency} onValueChange={setRegency} disabled={!regencies.length}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kota/kabupaten" />
                </SelectTrigger>
                <SelectContent>
                  {regencies.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Alamat lengkap</Label>
              <Textarea
                id="address"
                rows={3}
                minLength={5}
                placeholder="Jalan, nomor, RT/RW, kode pos"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span>
                  {i.name} x {i.quantity}
                </span>
                <span>{rupiah(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{rupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Ongkir</span>
            <span>{shipping === null ? 'pilih provinsi' : rupiah(shipping)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{rupiah(total)}</span>
          </div>
          <Button size="lg" className="w-full" disabled={busy || shipping === null || !regency || address.trim().length < 5}>
            {busy ? 'Memproses...' : 'Bayar sekarang'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
