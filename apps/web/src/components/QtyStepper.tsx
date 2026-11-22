'use client';

import { MinusIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QtyStepper({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-input p-1" role="group" aria-label={label}>
      <Button type="button" variant="ghost" size="icon-sm" className="rounded-full" aria-label="Kurangi" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <MinusIcon />
      </Button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button type="button" variant="ghost" size="icon-sm" className="rounded-full" aria-label="Tambah" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <PlusIcon />
      </Button>
    </div>
  );
}
