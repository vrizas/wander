import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { api, type Category } from '@/lib/api';

async function HeaderWithCategories() {
  const categories = await api<Category[]>('/categories').catch(() => []);
  return <Header categories={categories} />;
}

export function SiteHeader() {
  return (
    <Suspense fallback={<Header categories={[]} />}>
      <HeaderWithCategories />
    </Suspense>
  );
}
