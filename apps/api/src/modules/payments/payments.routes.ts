import { Router } from 'express';
import type { AuthFactory } from '../../common/auth.js';
import { unauthorized } from '../../common/http-error.js';
import { notificationSchema } from './payments.schema.js';
import type { PaymentsService } from './payments.service.js';

export function paymentsRouter(service: PaymentsService, auth: AuthFactory) {
  const r = Router();
  r.post('/orders/:orderId/snap', ...auth(), async (req, res) => {
    res.status(201).json(await service.createSnap(String(req.params.orderId), req.user!));
  });
  r.post('/orders/:orderId/sync', ...auth(), async (req, res) => {
    res.json(await service.syncOrder(String(req.params.orderId), req.user!));
  });
  r.post('/notification', async (req, res) => {
    const parsed = notificationSchema.safeParse(req.body);
    if (!parsed.success) throw unauthorized('Invalid signature');
    res.json(await service.handleNotification(parsed.data));
  });
  return r;
}
