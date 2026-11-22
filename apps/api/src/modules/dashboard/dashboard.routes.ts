import { Router } from 'express';
import type { AuthFactory } from '../../common/auth.js';
import type { DashboardService } from './dashboard.service.js';

export function dashboardRouter(service: DashboardService, auth: AuthFactory) {
  const r = Router();
  r.get('/', ...auth('ADMIN'), async (_req, res) => {
    res.json(await service.stats());
  });
  return r;
}
