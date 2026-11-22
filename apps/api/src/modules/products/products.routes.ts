import { Router } from 'express';
import type { AuthFactory } from '../../common/auth.js';
import { validate } from '../../common/validate.js';
import { createProductSchema, productQuerySchema, updateProductSchema } from './products.schema.js';
import type { ProductsService } from './products.service.js';

export function productsRouter(service: ProductsService, auth: AuthFactory) {
  const r = Router();
  r.get('/', async (req, res) => {
    res.json(await service.list(validate(productQuerySchema, req.query)));
  });
  r.get('/admin/list', ...auth('ADMIN'), async (req, res) => {
    res.json(await service.list(validate(productQuerySchema, req.query), true));
  });
  r.get('/:slug', async (req, res) => {
    res.json(await service.getBySlug(String(req.params.slug)));
  });
  r.post('/', ...auth('ADMIN'), async (req, res) => {
    res.status(201).json(await service.create(validate(createProductSchema, req.body)));
  });
  r.patch('/:id', ...auth('ADMIN'), async (req, res) => {
    res.json(await service.update(String(req.params.id), validate(updateProductSchema, req.body)));
  });
  r.delete('/:id', ...auth('ADMIN'), async (req, res) => {
    await service.remove(String(req.params.id));
    res.status(204).end();
  });
  return r;
}
