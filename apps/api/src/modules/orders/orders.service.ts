import { randomBytes } from 'node:crypto';
import type { AuthUser } from '../../common/auth.js';
import { badRequest, forbidden, notFound } from '../../common/http-error.js';
import type { AutomationService } from '../../integrations/automation/automation.service.js';
import type { PrismaClient } from '../../prisma.js';
import type { CreateOrderDto, OrderStatusValue } from './orders.schema.js';
import { estimateShipping } from './shipping.js';

const include = { items: true, payment: true } as const;

export class OrdersService {
  constructor(
    private prisma: PrismaClient,
    private automation: Pick<AutomationService, 'emit'>,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const qty = new Map<string, number>();
    for (const i of dto.items) qty.set(i.productId, (qty.get(i.productId) ?? 0) + i.quantity);

    return this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: [...qty.keys()] }, isActive: true },
      });
      if (products.length !== qty.size) throw badRequest('Some products are unavailable');

      for (const p of products) {
        const res = await tx.product.updateMany({
          where: { id: p.id, stock: { gte: qty.get(p.id)! } },
          data: { stock: { decrement: qty.get(p.id)! } },
        });
        if (res.count === 0) throw badRequest(`Insufficient stock for "${p.name}"`);
      }

      const subtotal = products.reduce((sum, p) => sum + p.price * qty.get(p.id)!, 0);
      const shippingCost = estimateShipping(dto.provinceId);
      return tx.order.create({
        data: {
          code: `ORD-${Date.now()}-${randomBytes(2).toString('hex').toUpperCase()}`,
          userId,
          subtotal,
          shippingCost,
          total: subtotal + shippingCost,
          shippingAddress: dto.shippingAddress,
          items: {
            create: products.map((p) => ({
              productId: p.id,
              name: p.name,
              price: p.price,
              quantity: qty.get(p.id)!,
            })),
          },
        },
        include,
      });
    });
  }

  async markPaid(id: string) {
    const res = await this.prisma.order.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'PAID' } });
    if (res.count === 0) return false;

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { name: true, email: true } } },
    });
    if (order) {
      void this.automation.emit('order.paid', {
        code: order.code,
        total: order.total,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        shippingAddress: order.shippingAddress,
        customer: order.user,
        items: order.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
      });
    }
    return true;
  }

  listMine(userId: string) {
    return this.prisma.order.findMany({ where: { userId }, include, orderBy: { createdAt: 'desc' } });
  }

  listAll(status?: OrderStatusValue) {
    return this.prisma.order.findMany({
      where: status ? { status } : {},
      include: { ...include, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string, user: AuthUser) {
    const order = await this.prisma.order.findUnique({ where: { id }, include });
    if (!order) throw notFound('Order not found');
    if (user.role !== 'ADMIN' && order.userId !== user.sub) throw forbidden('Access denied');
    return order;
  }

  async setStatus(id: string, status: OrderStatusValue) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw notFound('Order not found');
      if (order.status === status) return order;
      if (order.status !== 'PENDING') {
        throw badRequest(`Order with status ${order.status} cannot be changed to ${status}`);
      }
      if (status === 'CANCELLED' || status === 'EXPIRED') {
        for (const i of order.items) {
          await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.quantity } } });
        }
      }
      return tx.order.update({ where: { id }, data: { status }, include });
    });
  }
}
