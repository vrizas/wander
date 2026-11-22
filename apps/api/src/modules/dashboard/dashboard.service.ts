import type { PrismaClient } from '../../prisma.js';
import { LOW_STOCK_THRESHOLD } from '../products/products.service.js';

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async stats() {
    const [byStatus, revenue, lowStockCount, productCount, top] = await Promise.all([
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
      this.prisma.product.count({ where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.orderItem.groupBy({
        by: ['productId', 'name'],
        where: { order: { status: 'PAID' } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const orders = { PENDING: 0, PAID: 0, EXPIRED: 0, CANCELLED: 0 };
    for (const r of byStatus) orders[r.status] = r._count._all;

    return {
      orders: { ...orders, total: Object.values(orders).reduce((a, b) => a + b, 0) },
      revenue: revenue._sum.total ?? 0,
      productCount,
      lowStockCount,
      topProducts: top.map((t) => ({ name: t.name, sold: t._sum.quantity ?? 0 })),
    };
  }
}
