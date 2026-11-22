'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { ListSkeleton } from '@/components/skeletons';
import { ErrorMsg } from '@/components/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, type Category } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Category[] | null>(null);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api<Category[]>('/categories'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function run(fn: () => Promise<unknown>, success: string) {
    setError(null);
    try {
      await fn();
      toast.success(success);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const add = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await api('/categories', { method: 'POST', token, body: { name } });
      setName('');
    }, 'Kategori ditambahkan');
  };

  if (!items && !error) return <ListSkeleton rows={4} />;

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-light tracking-[0.1em] uppercase">Kategori</h1>
      <ErrorMsg>{error}</ErrorMsg>
      <form onSubmit={add} className="flex gap-2">
        <Input className="max-w-xs" placeholder="Nama kategori baru" value={name} onChange={(e) => setName(e.target.value)} required />
        <Button>
          <PlusIcon />
          Tambah
        </Button>
      </form>
      <Card className="gap-0 py-0">
        {items?.map((c) => (
          <div key={c.id} className="flex items-center gap-3 border-b p-3 text-sm last:border-b-0">
            {editId === c.id ? (
              <>
                <Input className="max-w-xs" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <Button
                  onClick={() =>
                    void run(async () => {
                      await api(`/categories/${c.id}`, { method: 'PATCH', token, body: { name: editName } });
                      setEditId(null);
                    }, 'Kategori disimpan')
                  }
                >
                  Simpan
                </Button>
                <Button variant="outline" onClick={() => setEditId(null)}>
                  Batal
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{c.slug}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditId(c.id);
                    setEditName(c.name);
                  }}
                >
                  <PencilIcon />
                  Ubah
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setToDelete(c)}>
                  <Trash2Icon />
                  Hapus
                </Button>
              </>
            )}
          </div>
        ))}
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori &quot;{toDelete?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>Produk di dalamnya tidak ikut terhapus, hanya menjadi tanpa kategori.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (toDelete) void run(() => api(`/categories/${toDelete.id}`, { method: 'DELETE', token }), 'Kategori dihapus');
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
