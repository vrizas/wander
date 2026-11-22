'use client';

import { XIcon } from 'lucide-react';
import { useSyncExternalStore } from 'react';

const KEY = 'wander.announcement.dismissed';
const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};

export function AnnouncementBar() {
  const dismissed = useSyncExternalStore(subscribe, read, () => false);
  if (dismissed) return null;
  return (
    <div className="relative bg-foreground px-10 py-2.5 text-center text-sm text-background">
      Ongkir flat Rp15.000 untuk Pulau Jawa dan 100% original
      <button
        type="button"
        aria-label="Tutup pengumuman"
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 hover:bg-white/15"
        onClick={() => {
          try {
            localStorage.setItem(KEY, '1');
          } catch {
          }
          listeners.forEach((l) => l());
        }}
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
