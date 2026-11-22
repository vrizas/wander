'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/skeletons';
import { ErrorMsg } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { api, rupiah, type Category, type Paged, type Product } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface Form {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: string;
  isActive: boolean;
}
const EMPTY: Form = { name: '', description: '', price: 0, stock: 0, imageUrl: '', categoryId: '', isActive: true };
const NO_CATEGORY = 'none';

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [p, c] = await Promise.all([
        api<Paged<Product>>('/products/admin/list?limit=100', { token }),
        api<Category[]>('/categories'),
      ]);
      setProducts(p.items);
      setCategories(c);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function open(p: Product | 'new') {
    setFormError(null);
    setEditing(p);
    setDialogOpen(true);
    setForm(
      p === 'new'
        ? EMPTY
        : {
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock,
            imageUrl: p.imageUrl ?? '',
            categoryId: p.categoryId ?? '',
            isActive: p.isActive,
          },
    );
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!token || !editing) return;
    setBusy(true);
    setFormError(null);
    const body = {
      name: form.name,
      description: form.description,
      price: form.price,
      stock: form.stock,
      isActive: form.isActive,
      ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
      ...(form.categoryId ? { categoryId: form.categoryId } : {}),
    };
    try {
      if (editing === 'new') await api('/products', { method: 'POST', token, body });
      else await api(`/products/${editing.id}`, { method: 'PATCH', token, body });
      toast.success(editing === 'new' ? 'Produk dibuat' : 'Produk disimpan');
      setDialogOpen(false);
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p: Product) {
    if (!token) return;
    try {
      await api(`/products/${p.id}`, { method: 'PATCH', token, body: { isActive: !p.isActive } });
      toast.success(p.isActive ? `${p.name} dinonaktifkan` : `${p.name} diaktifkan`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!products && !error) return <TableSkeleton cols={6} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-light tracking-[0.1em] uppercase">Produk</h1>
        <Button onClick={() => open('new')}>
          <PlusIcon />
          Produk baru
        </Button>
      </div>
      <ErrorMsg>{error}</ErrorMsg>

      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((p) => (
              <TableRow key={p.id} className={cn(!p.isActive && 'text-muted-foreground')}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.category?.name ?? '-'}</TableCell>
                <TableCell>{rupiah(p.price)}</TableCell>
                <TableCell className={cn(p.stock <= 5 && 'font-semibold text-amber-600')}>{p.stock}</TableCell>
                <TableCell>
                  <Badge variant={p.isActive ? 'secondary' : 'outline'}>{p.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                </TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button variant="ghost" size="sm" onClick={() => open(p)}>
                    <PencilIcon />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggle(p)}>
                    {p.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Produk baru' : `Edit: ${editing?.name ?? ''}`}</DialogTitle>
            <DialogDescription>Harga dalam Rupiah. Produk nonaktif tidak tampil di toko.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <ErrorMsg>{formError}</ErrorMsg>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Nama</Label>
                <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={form.categoryId || NO_CATEGORY} onValueChange={(v) => setForm({ ...form, categoryId: v === NO_CATEGORY ? '' : v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>Tanpa kategori</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Harga (Rp)</Label>
                <Input id="p-price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stok</Label>
                <Input id="p-stock" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="p-img">URL gambar (opsional)</Label>
                <Input id="p-img" type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="p-desc">Deskripsi</Label>
                <Textarea id="p-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox id="p-active" checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: c === true })} />
                <Label htmlFor="p-active">Aktif (tampil di toko)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
