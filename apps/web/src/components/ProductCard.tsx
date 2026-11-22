import Link from 'next/link';
import { ShoppingBagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { rupiah, type Product } from '@/lib/api';
import { PRODUCT_FALLBACK, withWidth } from '@/lib/photos';
import { cn } from '@/lib/utils';

export function ProductImage({
  product,
  className,
  width = 700,
}: {
  product: Pick<Product, 'name' | 'imageUrl'>;
  className?: string;
  width?: number;
}) {
  // eslint-disable-next-line @next/next/no-img-element -- URL gambar bebas (diisi admin), tidak dikonfigurasi di next/image
  return <img src={withWidth(product.imageUrl || PRODUCT_FALLBACK, width)} alt={product.name} className={cn('bg-neutral-200 object-cover', className)} />;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="rounded-3xl bg-neutral-100 p-3 transition group-hover:bg-neutral-200">
        <ProductImage product={product} className="aspect-[4/3] w-full rounded-2xl bg-transparent" />
        <div className="flex items-end justify-between gap-3 px-2 pt-3 pb-1">
          <div className="min-w-0 space-y-1">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{product.category?.name ?? 'Sepatu'}</p>
            <h3 className="truncate font-medium group-hover:underline">{product.name}</h3>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{rupiah(product.price)}</span>
              {product.stock === 0 ? (
                <Badge variant="destructive">Habis</Badge>
              ) : product.stock <= 5 ? (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Sisa {product.stock}
                </Badge>
              ) : null}
            </div>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition group-hover:scale-105">
            <ShoppingBagIcon className="size-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductTile({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block space-y-2">
      <ProductImage product={product} className="aspect-square w-full rounded-2xl" />
      <div className="space-y-0.5 px-1 text-sm">
        <p className="truncate font-medium group-hover:underline">{product.name}</p>
        <p className="font-semibold text-foreground">{rupiah(product.price)}</p>
      </div>
    </Link>
  );
}
