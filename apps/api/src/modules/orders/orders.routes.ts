import { Router } from 'express';
import type { AuthFactory } from '../../common/auth.js';
import { validate } from '../../common/validate.js';
import { createOrderSchema, orderQuerySchema, updateOrderStatusSchema } from './orders.schema.js';
import type { OrdersService } from './orders.service.js';

export function ordersRouter(service: OrdersService, auth: AuthFactory) {
  const r = Router();
  r.post('/', ...auth(), async (req, res) => {
    res.status(201).json(await service.create(req.user!.sub, validate(createOrderSchema, req.body)));
  });
  r.get('/me', ...auth(), async (req, res) => {
    res.json(await service.listMine(req.user!.sub));
  });
  r.get('/', ...auth('ADMIN'), async (req, res) => {
    res.json(await service.listAll(validate(orderQuerySchema, req.query).status));
  });
  r.get('/:id', ...auth(), async (req, res) => {
    res.json(await service.get(String(req.params.id), req.user!));
  });
  r.patch('/:id/status', ...auth('ADMIN'), async (req, res) => {
    res.json(await service.setStatus(String(req.params.id), validate(updateOrderStatusSchema, req.body).status));
  });
  return r;
}
