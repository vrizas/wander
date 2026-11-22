import { apiKeyAuth } from './common/api-key.js';
import { createAuth } from './common/auth.js';
import type { Config } from './config.js';
import { AutomationService } from './integrations/automation/automation.service.js';
import { MidtransClient } from './integrations/midtrans/midtrans.client.js';
import { RegionsClient } from './integrations/regions/regions.client.js';
import { AuthService } from './modules/auth/auth.service.js';
import { CategoriesService } from './modules/categories/categories.service.js';
import { DashboardService } from './modules/dashboard/dashboard.service.js';
import { OrdersService } from './modules/orders/orders.service.js';
import { PaymentsService } from './modules/payments/payments.service.js';
import { ProductsService } from './modules/products/products.service.js';
import type { PrismaClient } from './prisma.js';

export function buildContainer(config: Config, prisma: PrismaClient) {
  const automation = new AutomationService(config.n8nWebhookUrl);
  const midtrans = new MidtransClient(config.midtrans);
  const regions = new RegionsClient(config.regionsApiUrl);

  const orders = new OrdersService(prisma, automation);
  return {
    auth: createAuth(config.jwtSecret),
    requireApiKey: apiKeyAuth(config.n8nApiKey),
    regions,
    authService: new AuthService(prisma, config.jwtSecret),
    categories: new CategoriesService(prisma),
    products: new ProductsService(prisma),
    orders,
    payments: new PaymentsService(prisma, midtrans, orders, automation, config.webOrigin),
    dashboard: new DashboardService(prisma),
  };
}

export type Container = ReturnType<typeof buildContainer>;
