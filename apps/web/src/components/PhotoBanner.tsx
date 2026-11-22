import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PhotoBanner({
  src,
  alt,
  title,
  subtitle,
  cta = 'Lihat koleksi',
  href,
  className,
  size = 'md',
  priority = false,
}: {
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
  cta?: string;
  href: string;
  className?: string;
  size?: 'lg' | 'md' | 'sm';
  priority?: boolean;
}) {
  return (
    <section className={cn('group relative isolate overflow-hidden rounded-3xl bg-neutral-200', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- foto eksternal (Pexels), ukuran sudah diatur lewat parameter URL */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="absolute inset-0 -z-10 size-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-black/15 to-black/10" />
      <div
        className={cn(
          'flex h-full flex-col justify-end gap-3 p-5 text-white sm:p-8',
          size === 'lg' && 'min-h-[420px] sm:min-h-[520px]',
          size === 'md' && 'min-h-[320px] sm:min-h-[380px]',
          size === 'sm' && 'min-h-[220px] sm:min-h-[260px]',
        )}
      >
        <h2
          className={cn(
            'font-heading leading-[1.05] font-semibold tracking-[0.04em] uppercase drop-shadow-sm',
            size === 'lg' ? 'max-w-2xl text-4xl sm:text-6xl' : size === 'md' ? 'text-3xl sm:text-4xl' : 'text-2xl',
          )}
        >
          {title}
        </h2>
        {subtitle && <p className="max-w-md text-sm text-white/90 sm:text-base">{subtitle}</p>}
        <div>
          <Button asChild className="bg-white text-foreground hover:bg-white/90">
            <Link href={href}>{cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
