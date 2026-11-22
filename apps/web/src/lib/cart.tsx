'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from './api';
import { readJSON, writeJSON } from './storage';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  quantity: number;
}
interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (p: Pick<Product, 'id' | 'slug' | 'name' | 'price' | 'stock' | 'imageUrl'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const KEY = 'shop.cart';
const Ctx = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronisasi sekali dari localStorage setelah hidrasi
    setItems(readJSON<CartItem[]>(KEY) ?? []);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) writeJSON(KEY, items);
  }, [items, loaded]);

  const value = useMemo<CartState>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      add: (p, qty = 1) =>
        setItems((cur) => {
          const ex = cur.find((i) => i.productId === p.id);
          if (ex) {
            return cur.map((i) =>
              i.productId === p.id ? { ...i, stock: p.stock, quantity: Math.min(i.quantity + qty, p.stock) } : i,
            );
          }
          return [
            ...cur,
            {
              productId: p.id,
              slug: p.slug,
              name: p.name,
              price: p.price,
              stock: p.stock,
              imageUrl: p.imageUrl,
              quantity: Math.min(qty, p.stock),
            },
          ];
        }),
      setQty: (id, qty) =>
        setItems((cur) =>
          cur.map((i) => (i.productId === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i)),
        ),
      remove: (id) => setItems((cur) => cur.filter((i) => i.productId !== id)),
      clear: () => setItems([]),
    }),
    [items],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
