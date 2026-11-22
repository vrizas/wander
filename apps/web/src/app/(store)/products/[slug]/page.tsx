import Link from 'next/link';
import { Suspense } from 'react';
import { CreditCardIcon, ShieldCheckIcon, TruckIcon } from 'lucide-react';
import { ProductCard, ProductImage } from '@/components/ProductCard';
import { ProductDetailSkeleton } from '@/components/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, ApiError, rupiah, type Paged, type Product } from '@/lib/api';
import { AddToCart } from './AddToCart';

export default function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: Product;
  try {
    product = await api<Product>(`/products/${encodeURIComponent(slug)}`);
  } catch (e) {
    const notFound = e instanceof ApiError && e.status === 404;
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">{notFound ? 'Produk tidak ditemukan.' : (e as Error).message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/">Kembali ke katalog</Link>
        </Button>
      </div>
    );
  }

  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="space-y-14">
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            Beranda
          </Link>
          <span aria-hidden>/</span>
          {product.category ? (
            <>
              <Link href={`/?category=${product.category.slug}`} className="hover:underline">
                {product.category.name}
              </Link>
              <span aria-hidden>/</span>
            </>
          ) : null}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          <div className="rounded-3xl bg-neutral-100 p-3 sm:p-4">
            <ProductImage product={product} width={1400} className="aspect-square w-full rounded-2xl" />
          </div>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{product.category?.name ?? 'Umum'}</Badge>
              {product.stock === 0 ? (
                <Badge variant="destructive">Stok habis</Badge>
              ) : lowStock ? (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Sisa {product.stock} pasang
                </Badge>
              ) : (
                <Badge variant="secondary">Tersedia</Badge>
              )}
            </div>
            <h1 className="font-heading text-3xl font-light tracking-[0.08em] uppercase sm:text-4xl">{product.name}</h1>
            <p className="text-2xl font-semibold text-foreground">{rupiah(product.price)}</p>
            <p className="whitespace-pre-line text-muted-foreground">{product.description || 'Belum ada deskripsi.'}</p>
            <AddToCart product={product} />

            <ul className="grid gap-3 rounded-3xl bg-neutral-100 p-5 text-sm sm:grid-cols-1">
              {PERKS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="block font-medium">{title}</span>
                    <span className="text-muted-foreground">{text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <dl className="divide-y rounded-3xl border text-sm">
              <Row label="Kategori" value={product.category?.name ?? 'Umum'} />
              <Row label="Stok" value={product.stock === 0 ? 'Habis' : `${product.stock} pasang`} />
              <Row label="Pembayaran" value="Midtrans (kartu, e-wallet, transfer bank)" />
            </dl>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <Related product={product} />
      </Suspense>
    </div>
  );
}

const PERKS = [
  { icon: ShieldCheckIcon, title: '100% original', text: 'Setiap pasang dijamin asli.' },
  { icon: TruckIcon, title: 'Ongkir flat Rp15.000', text: 'Untuk seluruh Pulau Jawa.' },
  { icon: CreditCardIcon, title: 'Bayar aman', text: 'Diproses lewat Midtrans.' },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-5 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

async function Related({ product }: { product: Product }) {
  const wanted = 4;
  const pick = (r: Paged<Product>) => r.items.filter((p) => p.id !== product.id);
  let similar: Product[] = [];
  if (product.category) {
    similar = await api<Paged<Product>>(`/products?category=${encodeURIComponent(product.category.slug)}&limit=${wanted + 1}`)
      .then(pick)
      .catch(() => []);
  }
  similar = similar.slice(0, wanted);
  let others: Product[] = [];
  if (similar.length < wanted) {
    const seen = new Set(similar.map((p) => p.id));
    others = await api<Paged<Product>>(`/products?limit=${wanted * 2}`)
      .then(pick)
      .then((list) => list.filter((p) => !seen.has(p.id)).slice(0, wanted - similar.length))
      .catch(() => []);
  }
  if (similar.length === 0 && others.length === 0) return null;

  return (
    <div className="space-y-10">
      {similar.length > 0 ? <RelatedGrid title="Produk serupa" products={similar} /> : null}
      {others.length > 0 ? <RelatedGrid title={similar.length > 0 ? 'Pilihan lainnya' : 'Pilihan lain untuk Anda'} products={others} /> : null}
    </div>
  );
}

function RelatedGrid({ title, products }: { title: string; products: Product[] }) {
  return (
    <section className="space-y-5">
      <h2 className="font-heading text-xl font-light tracking-[0.1em] uppercase">{title}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
