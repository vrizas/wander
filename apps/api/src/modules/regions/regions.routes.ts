import { Router } from 'express';
import { badRequest } from '../../common/http-error.js';
import type { RegionsClient } from '../../integrations/regions/regions.client.js';
import { estimateShipping } from '../orders/shipping.js';

const ID = /^\d{2}$/;

export function regionsRouter(regions: RegionsClient) {
  const r = Router();
  r.get('/provinces', async (_req, res) => {
    res.json(await regions.provinces());
  });
  r.get('/provinces/:id/regencies', async (req, res) => {
    const id = String(req.params.id);
    if (!ID.test(id)) throw badRequest('Invalid province code');
    res.json(await regions.regencies(id));
  });
  r.get('/shipping-estimate', (req, res) => {
    const provinceId = String(req.query.provinceId ?? '');
    if (!ID.test(provinceId)) throw badRequest('Invalid provinceId');
    res.json({ provinceId, cost: estimateShipping(provinceId) });
  });
  return r;
}
