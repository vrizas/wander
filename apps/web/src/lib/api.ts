export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

export async function api<T>(path: string, { method = 'GET', body, token }: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server');
  }
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const msg = Array.isArray(j?.message) ? j.message.join(', ') : (j?.message ?? res.statusText);
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export type Role = 'ADMIN' | 'CUSTOMER';
export type OrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}
export interface Category {
  id: string;
  name: string;
  slug: string;
}
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  category: Category | null;
}
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}
export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
  payment: { status: string; paymentType: string | null } | null;
  user?: { id: string; name: string; email: string };
}
export interface Region {
  id: string;
  name: string;
}
export interface DashboardStats {
  orders: Record<OrderStatus | 'total', number>;
  revenue: number;
  productCount: number;
  lowStockCount: number;
  topProducts: { name: string; sold: number }[];
}
