'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCartIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QtyStepper } from '@/components/QtyStepper';
import type { Product } from '@/lib/api';
import { useCart } from '@/lib/cart';

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (product.stock === 0) return <Badge variant="destructive">Stok habis</Badge>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <QtyStepper value={qty} max={product.stock} onChange={setQty} label="Jumlah" />
        <Button
          size="lg"
          onClick={() => {
            add(product, qty);
            toast.success(`${product.name} ditambahkan ke keranjang`);
          }}
        >
          <ShoppingCartIcon />
          Tambah ke keranjang
        </Button>
      </div>
      <Link href="/cart" className="inline-block text-sm text-muted-foreground underline">
        Lihat keranjang
      </Link>
    </div>
  );
}
