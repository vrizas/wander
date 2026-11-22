import { Suspense } from 'react';
import { OrderDetailSkeleton } from '@/components/skeletons';
import { OrderDetail } from './OrderDetail';

export default function OrderPage() {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderDetail />
    </Suspense>
  );
}
