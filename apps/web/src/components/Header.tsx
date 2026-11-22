'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useSyncExternalStore, type FormEvent } from 'react';
import { LayoutDashboardIcon, LogOutIcon, PackageIcon, SearchIcon, ShoppingBagIcon, UserIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { Category } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAuthModal } from '@/lib/auth-modal';
import { useCart } from '@/lib/cart';
import { cn } from '@/lib/utils';

const STICKY_AFTER = 120;

function subscribeScroll(cb: () => void) {
  window.addEventListener('scroll', cb, { passive: true });
  return () => window.removeEventListener('scroll', cb);
}

function useScrolled() {
  return useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > STICKY_AFTER,
    () => false,
  );
}

function NavTabs({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const active = useSearchParams().get('category');
  const tabs = [{ href: '/', label: 'Beranda', on: pathname === '/' && !active }].concat(
    categories.map((c) => ({ href: `/?category=${c.slug}`, label: c.name, on: pathname === '/' && active === c.slug })),
  );
  return (
    <>
      {tabs.map((t) => (
        <Button key={t.href} asChild variant={t.on ? 'default' : 'outline'} className="px-6">
          <Link href={t.href}>{t.label}</Link>
        </Button>
      ))}
    </>
  );
}

function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    setOpen(false);
    router.push(q.trim() ? `/?search=${encodeURIComponent(q.trim())}` : '/');
  }

  return (
    <>
      <Button size="icon" aria-label="Cari sepatu" className="lg:hidden" onClick={() => setOpen(true)}>
        <SearchIcon />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cari sepatu</DialogTitle>
            <DialogDescription>Ketik nama sepatu, lalu tekan Enter.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex gap-3">
            <Input autoFocus placeholder="mis. runner, sandal, hi-top" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button>Cari</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      className="relative order-2 hidden max-w-xl flex-1 lg:block"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/?search=${encodeURIComponent(q.trim())}` : '/');
      }}
    >
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input aria-label="Cari sepatu" placeholder="Cari sepatu..." className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
    </form>
  );
}

function UserMenu() {
  const { user, ready, logout } = useAuth();
  const { openAuth } = useAuthModal();
  const router = useRouter();

  if (!ready) return <Button size="icon" aria-label="Akun" disabled><UserIcon /></Button>;
  if (!user) {
    return (
      <Button size="icon" aria-label="Masuk" onClick={() => openAuth()}>
        <UserIcon />
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" aria-label="Menu akun">
          <UserIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2">
        <DropdownMenuLabel className="space-y-0.5 px-3 py-2">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex flex-col gap-1 py-1">
          <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
            <Link href="/orders">
              <PackageIcon /> Pesanan saya
            </Link>
          </DropdownMenuItem>
          {user.role === 'ADMIN' && (
            <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
              <Link href="/admin">
                <LayoutDashboardIcon /> CMS
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="rounded-xl px-3 py-2.5"
            onClick={() => {
              logout();
              router.push('/');
            }}
          >
            <LogOutIcon /> Keluar
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ categories }: { categories: Category[] }) {
  const { count } = useCart();
  const scrolled = useScrolled();
  return (
    <header
      className={cn(
        'sticky top-0 z-40 -mx-4 flex flex-wrap items-center gap-x-6 gap-y-4 px-4 py-3 transition-[background-color,box-shadow] duration-300 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12',
        scrolled ? 'animate-header-in bg-white/90 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md motion-reduce:animate-none' : 'bg-white',
      )}
    >
      <Logo />
      <nav aria-label="Kategori" className="order-3 -mx-1 flex w-full items-center gap-3 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:order-1 sm:w-auto sm:overflow-visible">
        <Suspense fallback={<span className="h-10" />}>
          <NavTabs categories={categories} />
        </Suspense>
      </nav>
      <SearchBar />
      <div className="order-2 ml-auto flex items-center gap-3 sm:order-3">
        <SearchDialog />
        <Button asChild size="icon" aria-label={`Keranjang, ${count} barang`} className="relative">
          <Link href="/cart">
            <ShoppingBagIcon />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-neutral-400 text-[0.65rem] font-semibold text-foreground">
                {count}
              </span>
            )}
          </Link>
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
