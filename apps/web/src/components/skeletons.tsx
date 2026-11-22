import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const bar = 'bg-neutral-200';

export function ProductCardSkeleton() {
  return (
    <div className="rounded-3xl bg-neutral-100 p-3" aria-hidden>
      <Skeleton className={`aspect-[4/3] w-full rounded-2xl ${bar}`} />
      <div className="flex items-end justify-between gap-3 px-2 pt-3 pb-1">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className={`h-3 w-16 ${bar}`} />
          <Skeleton className={`h-5 w-3/4 ${bar}`} />
          <Skeleton className={`h-4 w-24 ${bar}`} />
        </div>
        <Skeleton className="size-11 shrink-0 rounded-full bg-neutral-300" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6, className = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-4 ${className}`} role="status" aria-label="Memuat produk">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-10 sm:space-y-14" role="status" aria-label="Memuat koleksi">
      <Skeleton className={`h-72 w-full rounded-3xl sm:h-96 ${bar}`} />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className={`h-56 rounded-3xl ${bar}`} />
        <Skeleton className={`h-56 rounded-3xl ${bar}`} />
      </div>
      <div className="space-y-5">
        <Skeleton className={`h-8 w-56 ${bar}`} />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Memuat produk">
      <Skeleton className={`h-4 w-64 ${bar}`} />
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <Skeleton className={`aspect-square w-full rounded-3xl ${bar}`} />
        <div className="space-y-5">
          <Skeleton className={`h-6 w-40 ${bar}`} />
          <Skeleton className={`h-10 w-4/5 ${bar}`} />
          <Skeleton className={`h-8 w-36 ${bar}`} />
          <div className="space-y-2">
            <Skeleton className={`h-4 w-full ${bar}`} />
            <Skeleton className={`h-4 w-5/6 ${bar}`} />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 w-32 rounded-full bg-neutral-300" />
            <Skeleton className="h-12 w-56 rounded-full bg-neutral-300" />
          </div>
          <Skeleton className={`h-44 w-full rounded-3xl ${bar}`} />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Memuat data">
      {Array.from({ length: rows }, (_, i) => (
        <Card key={i} className="flex-row items-center justify-between gap-4 p-4">
          <div className="space-y-2">
            <Skeleton className={`h-4 w-36 ${bar}`} />
            <Skeleton className={`h-3 w-48 ${bar}`} />
          </div>
          <div className="space-y-2">
            <Skeleton className={`ml-auto h-4 w-24 ${bar}`} />
            <Skeleton className="h-5 w-32 rounded-full bg-neutral-300" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y overflow-hidden rounded-xl border bg-white" role="status" aria-label="Memuat tabel">
      {Array.from({ length: rows + 1 }, (_, r) => (
        <div key={r} className={`flex items-center gap-4 p-4 ${r === 0 ? 'bg-neutral-200' : ''}`}>
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={`h-4 flex-1 ${r === 0 ? 'h-3 bg-neutral-300' : bar}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Memuat dashboard">
      <Skeleton className={`h-8 w-48 ${bar}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="gap-2 p-4">
            <Skeleton className={`h-3 w-24 ${bar}`} />
            <Skeleton className={`h-8 w-28 ${bar}`} />
          </Card>
        ))}
      </div>
      <Card className="gap-3 p-5">
        <Skeleton className={`h-5 w-36 ${bar}`} />
        <Skeleton className={`h-4 w-full ${bar}`} />
        <Skeleton className={`h-4 w-4/5 ${bar}`} />
      </Card>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]" role="status" aria-label="Memuat checkout">
      <div className="space-y-4">
        <Skeleton className={`h-8 w-40 ${bar}`} />
        <Card className="gap-4 p-5">
          <Skeleton className={`h-5 w-44 ${bar}`} />
          <Skeleton className="h-10 w-full rounded-full bg-neutral-200" />
          <Skeleton className="h-10 w-full rounded-full bg-neutral-200" />
          <Skeleton className="h-24 w-full rounded-2xl bg-neutral-200" />
        </Card>
      </div>
      <Card className="h-fit gap-3 p-5">
        <Skeleton className={`h-5 w-32 ${bar}`} />
        <Skeleton className={`h-4 w-full ${bar}`} />
        <Skeleton className="h-12 w-full rounded-full bg-neutral-300" />
      </Card>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" role="status" aria-label="Memuat pesanan">
      <Skeleton className={`h-4 w-32 ${bar}`} />
      <div className="flex items-center justify-between">
        <Skeleton className={`h-7 w-48 ${bar}`} />
        <Skeleton className="h-6 w-32 rounded-full bg-neutral-300" />
      </div>
      <Card className="gap-3 p-4">
        <Skeleton className={`h-4 w-full ${bar}`} />
        <Skeleton className={`h-4 w-full ${bar}`} />
        <Skeleton className={`h-5 w-1/2 ${bar}`} />
      </Card>
      <Card className="gap-2 p-4">
        <Skeleton className={`h-4 w-24 ${bar}`} />
        <Skeleton className={`h-4 w-3/4 ${bar}`} />
      </Card>
    </div>
  );
}
