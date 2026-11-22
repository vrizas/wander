import { CircleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/lib/api';
import { cn } from '@/lib/utils';

const STATUS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  EXPIRED: 'bg-neutral-200 text-neutral-700',
  CANCELLED: 'bg-red-100 text-red-800',
};
const LABEL: Record<OrderStatus, string> = {
  PENDING: 'Menunggu pembayaran',
  PAID: 'Lunas',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="secondary" className={cn('h-auto px-2.5 py-0.5', STATUS[status])}>
      {LABEL[status]}
    </Badge>
  );
}

export function ErrorMsg({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
      <CircleAlertIcon />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
