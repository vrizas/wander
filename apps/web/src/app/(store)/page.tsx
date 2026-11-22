import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { PhotoBanner } from '@/components/PhotoBanner';
import { ProductCard, ProductTile } from '@/components/ProductCard';
import { HomeSkeleton } from '@/components/skeletons';
import { ErrorMsg } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { api, type Category, type Paged, type Product } from '@/lib/api';
import { PHOTOS } from '@/lib/photos';

type Search = Promise<{ search?: string; category?: string; page?: string }>;

const heading = 'font-heading font-light uppercase tracking-[0.12em]';

function GenderSection({
  title,
  photo,
  alt,
  href,
  products,
  flip,
}: {
  title: string;
  photo: string;
  alt: string;
  href: string;
  products: Product[];
  flip?: boolean;
}) {
  if (products.length === 0) return null;
  return (
    <div className={`grid gap-4 ${flip ? 'lg:grid-cols-[2fr_minmax(260px,1fr)]' : 'lg:grid-cols-[minmax(260px,1fr)_2fr]'}`}>
      <PhotoBanner src={photo} alt={alt} title={title} cta="Lihat semua" href={href} size="md" className={flip ? 'lg:order-2' : ''} />
      <div className="grid grid-cols-2 content-start gap-x-4 gap-y-6 sm:grid-cols-3">
        {products.slice(0, 5).map((p) => (
          <ProductTile key={p.id} product={p} />
        ))}
        <Link
          href={href}
          className="flex aspect-square flex-col items-center justify-center gap-2 self-start rounded-2xl bg-neutral-200 text-center transition hover:bg-neutral-300"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-foreground text-background">
            <ArrowRightIcon className="size-5" />
          </span>
          <span className="text-sm font-medium">Lihat semua</span>
        </Link>
      </div>
    </div>
  );
}

export default function HomePage({ searchParams }: PageProps<'/'>) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home searchParams={searchParams as Search} />
    </Suspense>
  );
}

async function Home({ searchParams }: { searchParams: Search }) {
  const { search, category, page } = await searchParams;
  const filtered = !!(search || category || page);

  const qs = new URLSearchParams({ limit: filtered ? '12' : '6' });
  if (search) qs.set('search', search);
  if (category) qs.set('category', category);
  if (page) qs.set('page', page);

  let data: Paged<Product>;
  let categories: Category[];
  let her: Product[] = [];
  let him: Product[] = [];
  try {
    [data, categories] = await Promise.all([api<Paged<Product>>(`/products?${qs}`), api<Category[]>('/categories')]);
    if (!filtered) {
      [her, him] = await Promise.all(
        ['wanita', 'pria'].map((c) =>
          api<Paged<Product>>(`/products?category=${c}&limit=5`).then((r) => r.items).catch(() => []),
        ),
      );
    }
  } catch (e) {
    return <ErrorMsg>{`Failed to load products: ${(e as Error).message}. Make sure the API is running on port 3001.`}</ErrorMsg>;
  }

  const link = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ search, category, ...over })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/?${s}` : '/';
  };
  const current = data.page;
  const title = search
    ? `Hasil untuk “${search}”`
    : category
      ? (categories.find((c) => c.slug === category)?.name ?? 'Koleksi')
      : 'Koleksi terbaru';

  const catalog = (
    <section aria-labelledby="koleksi" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="koleksi" className={`${heading} text-2xl`}>
          {title}
        </h2>
        {filtered ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/?page=1">Lihat semua</Link>
          </Button>
        )}
      </div>

      {data.items.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Tidak ada sepatu yang cocok.</p>
      ) : (
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}>
          {data.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {filtered && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2 text-sm">
          {current > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={link({ page: String(current - 1) })}>
                <ArrowLeftIcon /> Sebelumnya
              </Link>
            </Button>
          )}
          <span className="text-muted-foreground">
            Halaman {current} / {data.totalPages}
          </span>
          {current < data.totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={link({ page: String(current + 1) })}>
                Berikutnya <ArrowRightIcon />
              </Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );

  if (filtered) return catalog;

  return (
    <div className="space-y-10 sm:space-y-14">
      <PhotoBanner
        priority
        size="lg"
        src={PHOTOS.hero.src}
        alt="Sepatu sneaker chunky di latar gelap"
        title="Koleksi sepatu terpopuler"
        subtitle="Model dan tren terbaru untuk setiap langkah. 100% original, dikirim ke seluruh Indonesia."
        href="/?page=1"
        cta="Belanja sekarang"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PhotoBanner
          src={PHOTOS.simple.src}
          alt="Tangan merapikan sneaker krem berpijakan kuning"
          title="Simple, made better"
          subtitle="Siluet bersih untuk dipakai setiap hari."
          href="/?category=unisex"
          cta="Lihat unisex"
        />
        <PhotoBanner
          src={PHOTOS.arrivals.src}
          alt="Pejalan kaki bersepatu di depan dinding grafiti"
          title="New arrivals"
          subtitle="Koleksi terbaru minggu ini."
          href="/?page=1"
          cta="Lihat terbaru"
        />
      </div>

      <GenderSection title="Untuk wanita" photo={PHOTOS.her.src} alt="Sneaker koral dengan jeans" href="/?category=wanita" products={her} />
      <GenderSection title="Untuk pria" photo={PHOTOS.him.src} alt="Pria berjalan di jalan batu dengan tas selempang oranye" href="/?category=pria" products={him} flip />

      <section aria-labelledby="koleksi-kami" className="space-y-5">
        <h2 id="koleksi-kami" className={`${heading} text-2xl`}>
          Koleksi kami
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <PhotoBanner size="sm" src={PHOTOS.running.src} alt="Pelari di lintasan" title="Lari" cta="Lihat lari" href="/?search=runner" />
          <PhotoBanner size="sm" src={PHOTOS.casual.src} alt="Sepasang sneaker putih di atas kertas warna-warni" title="Kasual" cta="Lihat kasual" href="/?search=low" />
          <PhotoBanner size="sm" src={PHOTOS.slides.src} alt="Sandal slide" title="Santai" cta="Lihat sandal" href="/?search=sandal" />
        </div>
      </section>

      {catalog}
    </div>
  );
}
