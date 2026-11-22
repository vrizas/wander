'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2Icon } from 'lucide-react';
import { ProductImage } from '@/components/ProductCard';
import { QtyStepper } from '@/components/QtyStepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { rupiah } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAuthModal } from '@/lib/auth-modal';
import { useCart } from '@/lib/cart';

export default function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const { user, ready } = useAuth();
  const { openAuth } = useAuthModal();
  const router = useRouter();

  function checkout() {
    if (user) router.push('/checkout');
    else openAuth({ next: '/checkout', reason: 'Masuk dulu untuk melanjutkan checkout.' });
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Keranjang masih kosong.</p>
        <Button asChild className="mt-4">
          <Link href="/">Mulai belanja</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <h1 className="font-heading text-2xl font-light tracking-[0.1em] uppercase">Keranjang</h1>
        {items.map((i) => (
          <Card key={i.productId} className="flex-row items-start gap-4 p-4 sm:gap-5 sm:p-5">
            <div className="shrink-0 overflow-hidden rounded-2xl bg-neutral-100 p-1.5">
              <ProductImage product={i} className="size-20 rounded-xl sm:size-24" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <Link href={`/products/${i.slug}`} className="block truncate font-medium hover:underline">
                  {i.name}
                </Link>
                <p className="text-sm text-muted-foreground">{rupiah(i.price)}</p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <QtyStepper value={i.quantity} max={i.stock} onChange={(n) => setQty(i.productId, n)} label={`Jumlah ${i.name}`} />
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(i.productId)}>
                    <Trash2Icon />
                    Hapus
                  </Button>
                </div>
              </div>
              <p className="shrink-0 font-semibold sm:pt-0.5">{rupiah(i.price * i.quantity)}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="h-fit">
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{rupiah(subtotal)}</span>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">Ongkos kirim dihitung di langkah berikutnya.</p>
          <Button className="w-full" disabled={!ready} onClick={checkout}>
            Lanjut ke checkout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
