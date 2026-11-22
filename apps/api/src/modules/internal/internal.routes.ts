import { Router, type RequestHandler } from 'express';
import type { PaymentsService } from '../payments/payments.service.js';

export function internalRouter(payments: PaymentsService, requireKey: RequestHandler) {
  const r = Router();
  r.use(requireKey);
  r.post('/reconcile-payments', async (_req, res) => {
    res.json(await payments.reconcile());
  });
  return r;
}
