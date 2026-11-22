import { describe, expect, it, vi } from 'vitest';
import { OrdersService } from './orders.service.js';
import { SHIPPING_JAVA, SHIPPING_OUTSIDE_JAVA, estimateShipping } from './shipping.js';

const automation = { emit: vi.fn() } as never;

function makePrisma(tx: Record<string, unknown>) {
  return { $transaction: (fn: (t: unknown) => unknown) => fn(tx) } as never;
}

describe('OrdersService.create', () => {
  const dto = { items: [{ productId: 'p1', quantity: 2 }], shippingAddress: 'Jl. Test 1', provinceId: '32' };

  it('rejects the order when stock is insufficient', async () => {
    const tx = {
      product: {
        findMany: vi.fn().mockResolvedValue([{ id: 'p1', name: 'Lampu', price: 1000 }]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      order: { create: vi.fn() },
    };
    const svc = new OrdersService(makePrisma(tx), automation);
    await expect(svc.create('u1', dto)).rejects.toMatchObject({ status: 400 });
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('computes total = subtotal + shipping (from the server) and decrements stock', async () => {
    const tx = {
      product: {
        findMany: vi.fn().mockResolvedValue([{ id: 'p1', name: 'Lampu', price: 1000 }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      order: { create: vi.fn().mockImplementation(({ data }) => data) },
    };
    const svc = new OrdersService(makePrisma(tx), automation);
    const order = (await svc.create('u1', dto)) as unknown as { total: number };
    expect(order.total).toBe(2000 + SHIPPING_JAVA);
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
  });
});

describe('OrdersService.setStatus', () => {
  it('restores stock when a PENDING order is cancelled', async () => {
    const tx = {
      order: {
        findUnique: vi.fn().mockResolvedValue({ id: 'o1', status: 'PENDING', items: [{ productId: 'p1', quantity: 3 }] }),
        update: vi.fn().mockResolvedValue({ id: 'o1', status: 'CANCELLED' }),
      },
      product: { update: vi.fn() },
    };
    await new OrdersService(makePrisma(tx), automation).setStatus('o1', 'CANCELLED');
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { stock: { increment: 3 } },
    });
  });

  it('refuses to change an order that is already final', async () => {
    const tx = { order: { findUnique: vi.fn().mockResolvedValue({ id: 'o1', status: 'PAID', items: [] }) } };
    await expect(new OrdersService(makePrisma(tx), automation).setStatus('o1', 'CANCELLED')).rejects.toMatchObject({ status: 400 });
  });
});

describe('estimateShipping', () => {
  it('Java is cheaper than outside Java', () => {
    expect(estimateShipping('31')).toBe(SHIPPING_JAVA);
    expect(estimateShipping('64')).toBe(SHIPPING_OUTSIDE_JAVA);
  });
});

describe('OrdersService.markPaid', () => {
  it('emits the order.paid event only when it actually changes from PENDING', async () => {
    const emit = vi.fn();
    const order = {
      code: 'ORD-1', total: 10, subtotal: 10, shippingCost: 0, shippingAddress: 'x',
      user: { name: 'A', email: 'a@b.c' }, items: [{ name: 'P', price: 10, quantity: 1 }],
    };
    const prisma = {
      order: {
        updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue(order),
      },
    } as never;
    const svc = new OrdersService(prisma, { emit } as never);
    expect(await svc.markPaid('o1')).toBe(true);
    expect(await svc.markPaid('o1')).toBe(false);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('order.paid', expect.objectContaining({ code: 'ORD-1' }));
  });
});
