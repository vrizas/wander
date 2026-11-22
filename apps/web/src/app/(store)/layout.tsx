import type { ReactNode } from 'react';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { SiteHeader } from '@/components/SiteHeader';
import { BRAND } from '@/lib/brand';

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <AnnouncementBar />
      <div className="flex flex-1 flex-col px-4 pt-1 pb-4 sm:px-8 sm:pt-3 sm:pb-6 lg:px-12">
        <SiteHeader />
        <main className="mt-3 flex-1 sm:mt-5">{children}</main>
        <footer className="mt-10 border-t border-border py-5 text-center text-xs tracking-[0.2em] text-muted-foreground uppercase">
          © 2026 {BRAND}. Hak cipta dilindungi.
        </footer>
      </div>
    </div>
  );
}
