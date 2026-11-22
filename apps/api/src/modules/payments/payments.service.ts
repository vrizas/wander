import type { AuthUser } from '../../common/auth.js';
import { badRequest, forbidden, notFound, unauthorized } from '../../common/http-error.js';
import type { PaymentStatus } from '../../generated/prisma/enums.js';
import type { AutomationService } from '../../integrations/automation/automation.service.js';
import type { MidtransClient, MidtransNotification } from '../../integrations/midtrans/midtrans.client.js';
import type { PrismaClient } from '../../prisma.js';
import type { OrdersService } from '../orders/orders.service.js';

type OrderOutcome = 'PAID' | 'CANCELLED' | 'EXPIRED' | null;

export function mapTransactionStatus(
  status: string,
  fraud?: string,
): { payment: PaymentStatus; order: OrderOutcome } {
  switch (status) {
    case 'settlement':
      return { payment: 'SETTLEMENT', order: 'PAID' };
    case 'capture':
      return fraud === 'accept' || !fraud
        ? { payment: 'SETTLEMENT', order: 'PAID' }
        : { payment: 'PENDING', order: null };
    case 'deny':
      return { payment: 'DENIED', order: null };
    case 'cancel':
      return { payment: 'CANCELLED', order: 'CANCELLED' };
    case 'expire':
      return { payment: 'EXPIRED', order: 'EXPIRED' };
    default:
      return { payment: 'PENDING', order: null };
  }
}

export class PaymentsService {
  constructor(
    private prisma: PrismaClient,
    private midtrans: Pick<MidtransClient, 'createSnapTransaction' | 'verifySignature' | 'getTransactionStatus'>,
    private orders: Pick<OrdersService, 'markPaid' | 'setStatus'>,
    private automation: Pick<AutomationService, 'emit'>,
    private webOrigin: string,
  ) {}

  async createSnap(orderId: string, user: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true, payment: true },
    });
    if (!order) throw notFound('Order not found');
    if (order.userId !== user.sub) throw forbidden('Access denied');
    if (order.status !== 'PENDING') throw badRequest(`Order is already ${order.status}`);

    if (order.payment?.snapToken && order.payment.redirectUrl) {
      return { snapToken: order.payment.snapToken, redirectUrl: order.payment.redirectUrl };
    }

    const itemDetails = order.items.map((i) => ({
      id: i.productId,
      name: i.name.slice(0, 50),
      price: i.price,
      quantity: i.quantity,
    }));
    if (order.shippingCost > 0) {
      itemDetails.push({ id: 'SHIPPING', name: 'Ongkos kirim', price: order.shippingCost, quantity: 1 });
    }

    const snap = await this.midtrans.createSnapTransaction({
      transaction_details: { order_id: order.code, gross_amount: order.total },
      item_details: itemDetails,
      customer_details: { first_name: order.user.name, email: order.user.email },
    });

    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: { snapToken: snap.token, redirectUrl: snap.redirect_url },
      create: { orderId: order.id, snapToken: snap.token, redirectUrl: snap.redirect_url },
    });
    return { snapToken: snap.token, redirectUrl: snap.redirect_url };
  }

  async handleNotification(n: MidtransNotification) {
    if (!this.midtrans.verifySignature(n)) throw unauthorized('Invalid signature');
    await this.applyStatus(n);
    return { received: true };
  }

  async syncOrder(orderId: string, user: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, code: true, status: true, userId: true },
    });
    if (!order) throw notFound('Order not found');
    if (order.userId !== user.sub) throw forbidden('Access denied');
    if (order.status !== 'PENDING') return { status: order.status };

    const tx = await this.midtrans.getTransactionStatus(order.code);
    if (tx) {
      if (!this.midtrans.verifySignature(tx)) throw unauthorized('Invalid signature from Midtrans');
      await this.applyStatus(tx);
    }
    const after = await this.prisma.order.findUnique({ where: { id: order.id }, select: { status: true } });
    return { status: after?.status ?? order.status };
  }

  async reconcile() {
    const pending = await this.prisma.order.findMany({
      where: { status: 'PENDING', payment: { is: { snapToken: { not: null } } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    const result = {
      checked: pending.length,
      skipped: 0,
      updated: [] as { code: string; from: string; to: string }[],
      errors: [] as { code: string; message: string }[],
    };
    for (const order of pending) {
      try {
        const tx = await this.midtrans.getTransactionStatus(order.code);
        if (!tx) {
          result.skipped++;
          continue;
        }
        if (!this.midtrans.verifySignature(tx)) throw new Error('Invalid signature from Midtrans');
        await this.applyStatus(tx);
        const after = await this.prisma.order.findUnique({ where: { id: order.id }, select: { status: true } });
        if (after && after.status !== order.status) {
          result.updated.push({ code: order.code, from: order.status, to: after.status });
        }
      } catch (e) {
        result.errors.push({ code: order.code, message: (e as Error).message });
      }
    }
    console.log(
      `Reconciliation: ${result.checked} checked, ${result.updated.length} updated, ${result.skipped} skipped, ${result.errors.length} failed`,
    );
    return result;
  }

  private async applyStatus(n: MidtransNotification) {
    const order = await this.prisma.order.findUnique({ where: { code: n.order_id } });
    if (!order) throw notFound('Order not found');
    if (Number(n.gross_amount) !== order.total) {
      throw badRequest('Payment amount does not match the order');
    }

    const mapped = mapTransactionStatus(n.transaction_status, n.fraud_status);

    const existing = await this.prisma.payment.findUnique({ where: { orderId: order.id } });
    if (existing?.status === 'SETTLEMENT' && mapped.payment !== 'SETTLEMENT') {
      console.warn(`Order ${order.code}: ${n.transaction_status} notification ignored (already SETTLEMENT)`);
      return;
    }

    const fields = {
      status: mapped.payment,
      paymentType: n.payment_type,
      transactionId: n.transaction_id,
      rawPayload: n as never,
      ...(mapped.order === 'PAID' ? { paidAt: new Date() } : {}),
    };
    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: fields,
      create: { orderId: order.id, ...fields },
    });

    let failure: 'denied' | 'expired' | 'cancelled' | null = null;
    if (mapped.order === 'PAID') {
      const changed = await this.orders.markPaid(order.id);
      console.log(`Order ${order.code} ${changed ? 'marked as PAID' : 'already final, ignored'}`);
    } else if (mapped.order && order.status === 'PENDING') {
      await this.orders.setStatus(order.id, mapped.order);
      console.log(`Order ${order.code} is now ${mapped.order}`);
      failure = mapped.order === 'EXPIRED' ? 'expired' : 'cancelled';
    } else if (mapped.payment === 'DENIED' && existing?.status !== 'DENIED') {
      failure = 'denied';
    }
    if (failure) await this.notifyFailure(order.id, failure);
  }

  private async notifyFailure(orderId: string, reason: 'denied' | 'expired' | 'cancelled') {
    const o = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { name: true, email: true } } },
    });
    if (!o) return;
    void this.automation.emit('payment.failed', {
      reason,
      code: o.code,
      total: o.total,
      orderUrl: `${this.webOrigin}/orders/${o.id}`,
      customer: o.user,
      items: o.items.map((i) => ({ name: i.name, quantity: i.quantity })),
    });
  }
}
