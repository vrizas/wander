'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { LayoutDashboardIcon, LogOutIcon, PackageIcon, ReceiptTextIcon, TagsIcon, UserIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { RequireLogin } from '@/components/RequireLogin';
import { StatsSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/admin/products', label: 'Produk', icon: PackageIcon },
  { href: '/admin/categories', label: 'Kategori', icon: TagsIcon },
  { href: '/admin/orders', label: 'Order', icon: ReceiptTextIcon },
];

function Gate({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">{children}</div>;
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" aria-label="Menu profil">
          <UserIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2">
        <DropdownMenuLabel className="space-y-0.5 px-3 py-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="rounded-xl px-3 py-2.5" onClick={logout}>
          <LogOutIcon /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLinks({ pathname, orientation }: { pathname: string; orientation: 'vertical' | 'horizontal' }) {
  return (
    <nav aria-label="Menu CMS" className={cn('flex gap-2', orientation === 'vertical' ? 'flex-col' : 'overflow-x-auto')}>
      {NAV.map((n) => {
        const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-11 shrink-0 items-center gap-3 rounded-full px-4 text-sm font-medium transition-colors',
              active ? 'bg-foreground text-background' : 'text-neutral-600 hover:bg-neutral-100 hover:text-foreground',
            )}
          >
            <n.icon className="size-4" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();

  if (!ready) {
    return (
      <Gate>
        <div className="w-full max-w-3xl">
          <StatsSkeleton />
        </div>
      </Gate>
    );
  }
  if (!user) {
    return (
      <Gate>
        <RequireLogin message="Masuk sebagai admin untuk membuka CMS." next="/admin" />
      </Gate>
    );
  }
  if (user.role !== 'ADMIN') {
    return (
      <Gate>
        <p className="text-muted-foreground">Halaman ini khusus admin.</p>
      </Gate>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 [--card:#ffffff]">
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo href="/admin" label="Dashboard CMS" />
          <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">CMS</span>
        </div>
        <ProfileMenu />
      </header>
      <div className="flex flex-1">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r bg-white p-4 md:block">
          <NavLinks pathname={pathname} orientation="vertical" />
        </aside>
        <div className="min-w-0 flex-1">
          <div className="border-b bg-white px-4 py-3 md:hidden">
            <NavLinks pathname={pathname} orientation="horizontal" />
          </div>
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
