import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export function Logo({ href = '/', label = `${BRAND} beranda` }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2" aria-label={label}>
      <svg viewBox="0 0 52 28" className="h-7 w-12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8 L11 22 L18 8 L25 22 L32 8" />
        <path d="M30 24 C38 24 46 16 49 4" />
      </svg>
      <span className="font-heading text-xl font-semibold tracking-tight">{BRAND}</span>
    </Link>
  );
}
