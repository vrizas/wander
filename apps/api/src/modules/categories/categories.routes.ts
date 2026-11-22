import { Router } from 'express';
import type { AuthFactory } from '../../common/auth.js';
import { validate } from '../../common/validate.js';
import { categorySchema } from './categories.schema.js';
import type { CategoriesService } from './categories.service.js';

export function categoriesRouter(service: CategoriesService, auth: AuthFactory) {
  const r = Router();
  r.get('/', async (_req, res) => {
    res.json(await service.list());
  });
  r.post('/', ...auth('ADMIN'), async (req, res) => {
    res.status(201).json(await service.create(validate(categorySchema, req.body)));
  });
  r.patch('/:id', ...auth('ADMIN'), async (req, res) => {
    res.json(await service.update(String(req.params.id), validate(categorySchema, req.body)));
  });
  r.delete('/:id', ...auth('ADMIN'), async (req, res) => {
    await service.remove(String(req.params.id));
    res.status(204).end();
  });
  return r;
}
