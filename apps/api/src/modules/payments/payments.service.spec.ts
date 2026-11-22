import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { MidtransClient } from '../../integrations/midtrans/midtrans.client.js';
import { mapTransactionStatus, PaymentsService } from './payments.service.js';

const KEY = 'SB-Mid-server-test';
const midtransConfig = { serverKey: KEY, snapUrl: 'http://unused', apiUrl: 'http://unused' };
const sign = (id: string, code: string, amount: string) =>
  createHash('sha512').update(`${id}${code}${amount}${KEY}`).digest('hex');

describe('MidtransClient.verifySignature', () => {
  const client = new MidtransClient(midtransConfig);
  const base = { order_id: 'ORD-1', status_code: '200', gross_amount: '285000.00' };

  it('accepts a valid signature', () => {
    expect(client.verifySignature({ ...base, signature_key: sign('ORD-1', '200', '285000.00') })).toBe(true);
  });
  it('rejects a forged signature or missing fields', () => {
    expect(client.verifySignature({ ...base, signature_key: 'x'.repeat(128) })).toBe(false);
    expect(client.verifySignature({ ...base, signature_key: '' })).toBe(false);
  });
  it('rejects when the amount is changed after signing', () => {
    const signature_key = sign('ORD-1', '200', '285000.00');
    expect(client.verifySignature({ ...base, gross_amount: '1000.00', signature_key })).toBe(false);
  });
});

describe('MidtransClient without a server key', () => {
  it('creating a Snap token fails with a clear 503, not a mysterious 500', async () => {
    const client = new MidtransClient({ serverKey: '', snapUrl: 'http://unused', apiUrl: 'http://unused' });
    await expect(
      client.createSnapTransaction({
        transaction_details: { order_id: 'x', gross_amount: 1 },
        item_details: [],
        customer_details: { first_name: 'a', email: 'a@b.c' },
      }),
    ).rejects.toMatchObject({ status: 503 });
  });
});

describe('mapTransactionStatus', () => {
  it.each([
    ['settlement', undefined, 'SETTLEMENT', 'PAID'],
    ['capture', 'accept', 'SETTLEMENT', 'PAID'],
    ['capture', 'challenge', 'PENDING', null],
    ['pending', undefined, 'PENDING', null],
    ['deny', undefined, 'DENIED', null],
    ['cancel', undefined, 'CANCELLED', 'CANCELLED'],
    ['expire', undefined, 'EXPIRED', 'EXPIRED'],
  ])('%s (%s) maps to payment %s and order %s', (status, fraud, payment, order) => {
    expect(mapTransactionStatus(status, fraud)).toEqual({ payment, order });
  });
});

describe('PaymentsService.handleNotification', () => {
  const order = {
    id: 'o1',
    code: 'ORD-1',
    total: 285000,
    status: 'PENDING',
    user: { name: 'Ani', email: 'ani@wander.test' },
    items: [{ name: 'Lampu', quantity: 1 }],
  };
  const notif = (over: Record<string, string> = {}) => ({
    order_id: 'ORD-1',
    status_code: '200',
    gross_amount: '285000.00',
    transaction_status: 'settlement',
    signature_key: sign('ORD-1', '200', '285000.00'),
    ...over,
  });
  const setup = () => {
    const prisma = {
      order: { findUnique: vi.fn().mockResolvedValue(order) },
      payment: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) },
    };
    const orders = { markPaid: vi.fn().mockResolvedValue(true), setStatus: vi.fn() };
    const automation = { emit: vi.fn() };
    const svc = new PaymentsService(
      prisma as never,
      new MidtransClient(midtransConfig),
      orders as never,
      automation,
      'http://web.test',
    );
    return { svc, prisma, orders, automation };
  };

  it('settlement marks the order as PAID', async () => {
    const { svc, orders, prisma } = setup();
    await svc.handleNotification(notif());
    expect(orders.markPaid).toHaveBeenCalledWith('o1');
    expect(prisma.payment.upsert).toHaveBeenCalledOnce();
  });
  it('expire sets the order to EXPIRED and restores stock through OrdersService', async () => {
    const { svc, orders } = setup();
    await svc.handleNotification(notif({ transaction_status: 'expire' }));
    expect(orders.setStatus).toHaveBeenCalledWith('o1', 'EXPIRED');
  });
  it('an expire notification after SETTLEMENT is ignored (status is not downgraded)', async () => {
    const { svc, prisma, orders } = setup();
    prisma.payment.findUnique.mockResolvedValue({ status: 'SETTLEMENT' });
    await svc.handleNotification(notif({ transaction_status: 'expire' }));
    expect(prisma.payment.upsert).not.toHaveBeenCalled();
    expect(orders.setStatus).not.toHaveBeenCalled();
  });
  it('expire sends a payment.failed event to n8n with the order link', async () => {
    const { svc, automation } = setup();
    await svc.handleNotification(notif({ transaction_status: 'expire' }));
    expect(automation.emit).toHaveBeenCalledWith(
      'payment.failed',
      expect.objectContaining({ reason: 'expired', code: 'ORD-1', orderUrl: 'http://web.test/orders/o1' }),
    );
  });
  it('deny sends payment.failed only once and keeps the order PENDING so payment can be retried', async () => {
    const { svc, prisma, orders, automation } = setup();
    await svc.handleNotification(notif({ transaction_status: 'deny' }));
    expect(orders.setStatus).not.toHaveBeenCalled();
    expect(automation.emit).toHaveBeenCalledWith('payment.failed', expect.objectContaining({ reason: 'denied' }));
    prisma.payment.findUnique.mockResolvedValue({ status: 'DENIED' });
    await svc.handleNotification(notif({ transaction_status: 'deny' }));
    expect(automation.emit).toHaveBeenCalledTimes(1);
  });
  it('settlement does not send payment.failed', async () => {
    const { svc, automation } = setup();
    await svc.handleNotification(notif());
    expect(automation.emit).not.toHaveBeenCalled();
  });
  it('rejects a wrong signature without touching the database', async () => {
    const { svc, prisma } = setup();
    await expect(svc.handleNotification(notif({ signature_key: 'wrong' }))).rejects.toMatchObject({ status: 401 });
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });
  it('rejects when gross_amount does not match the order total', async () => {
    const { svc } = setup();
    const n = notif({ gross_amount: '1000.00', signature_key: sign('ORD-1', '200', '1000.00') });
    await expect(svc.handleNotification(n)).rejects.toMatchObject({ status: 400 });
  });
});

describe('PaymentsService.reconcile', () => {
  const orderRow = (code: string, total = 1000, status = 'PENDING') => ({ id: `id-${code}`, code, total, status, userId: 'u1' });
  const status = (code: string, transaction_status: string, amount = '1000.00') => ({
    order_id: code,
    status_code: '200',
    gross_amount: amount,
    transaction_status,
    signature_key: sign(code, '200', amount),
  });

  function setup(rows: ReturnType<typeof orderRow>[], remote: Record<string, unknown>) {
    const after: Record<string, string> = {};
    const prisma = {
      order: {
        findMany: vi.fn().mockResolvedValue(rows),
        findUnique: vi.fn().mockImplementation(({ where }: { where: { id?: string; code?: string } }) => {
          const row = rows.find((r) => r.id === where.id || r.code === where.code);
          return Promise.resolve(row ? { ...row, status: after[row.id] ?? row.status, user: { name: 'A', email: 'a@b.c' }, items: [] } : null);
        }),
      },
      payment: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) },
    };
    const orders = {
      markPaid: vi.fn().mockImplementation(async (id: string) => ((after[id] = 'PAID'), true)),
      setStatus: vi.fn().mockImplementation(async (id: string, st: string) => (after[id] = st)),
    };
    const client = new MidtransClient(midtransConfig);
    const midtrans = {
      verifySignature: client.verifySignature.bind(client),
      createSnapTransaction: vi.fn(),
      getTransactionStatus: vi.fn().mockImplementation(async (code: string) => {
        const r = remote[code];
        if (r instanceof Error) throw r;
        return r ?? null;
      }),
    };
    const svc = new PaymentsService(prisma as never, midtrans as never, orders as never, { emit: vi.fn() }, 'http://web.test');
    return { svc, orders, midtrans };
  }

  it('reconciles orders whose webhook was lost, skips those without a transaction, and records errors', async () => {
    const { svc } = setup([orderRow('A'), orderRow('B'), orderRow('C'), orderRow('D')], {
      A: status('A', 'settlement'),
      B: status('B', 'expire'),
      D: new Error('Midtrans down'),
    });
    const r = await svc.reconcile();
    expect(r.checked).toBe(4);
    expect(r.skipped).toBe(1);
    expect(r.updated).toEqual([
      { code: 'A', from: 'PENDING', to: 'PAID' },
      { code: 'B', from: 'PENDING', to: 'EXPIRED' },
    ]);
    expect(r.errors).toEqual([{ code: 'D', message: 'Midtrans down' }]);
  });

  it('a payment still pending at Midtrans changes nothing, and a wrong amount is recorded as an error', async () => {
    const { svc, orders } = setup([orderRow('A'), orderRow('B')], {
      A: status('A', 'pending'),
      B: status('B', 'settlement', '999.00'),
    });
    const r = await svc.reconcile();
    expect(r.updated).toEqual([]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]!.code).toBe('B');
    expect(orders.markPaid).not.toHaveBeenCalled();
  });

  describe('syncOrder', () => {
    const owner = { sub: 'u1', email: 'a@b.c', role: 'CUSTOMER' } as never;

    it('a PENDING order already settled at Midtrans becomes PAID immediately without waiting for the webhook', async () => {
      const { svc, orders } = setup([orderRow('A')], { A: status('A', 'settlement') });
      await expect(svc.syncOrder('id-A', owner)).resolves.toEqual({ status: 'PAID' });
      expect(orders.markPaid).toHaveBeenCalledWith('id-A');
    });

    it('an order with no transaction or a pending one stays PENDING, and a final order does not contact Midtrans', async () => {
      const a = setup([orderRow('A'), orderRow('B', 1000, 'PAID')], { A: status('A', 'pending') });
      await expect(a.svc.syncOrder('id-A', owner)).resolves.toEqual({ status: 'PENDING' });
      await expect(a.svc.syncOrder('id-B', owner)).resolves.toEqual({ status: 'PAID' });
      expect(a.midtrans.getTransactionStatus).toHaveBeenCalledTimes(1);
    });

    it('rejects an order owned by another user and an order that does not exist', async () => {
      const { svc } = setup([orderRow('A')], {});
      await expect(svc.syncOrder('id-A', { sub: 'u2', email: 'x@y.z', role: 'CUSTOMER' } as never)).rejects.toMatchObject({ status: 403 });
      await expect(svc.syncOrder('id-Z', owner)).rejects.toMatchObject({ status: 404 });
    });
  });
});
