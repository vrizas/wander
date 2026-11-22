import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';
import { HttpError, notFound } from './common/http-error.js';
import type { Config } from './config.js';
import type { Container } from './container.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { internalRouter } from './modules/internal/internal.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { regionsRouter } from './modules/regions/regions.routes.js';
import { openApiDocument } from './openapi.js';

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let e: HttpError;
  if (err instanceof HttpError) {
    e = err;
  } else if (err?.code === 'P2025') {
    e = new HttpError(404, 'Record not found');
  } else if (err?.code === 'P2002') {
    e = new HttpError(409, 'Record already exists');
  } else if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500) {
    e = new HttpError(err.status, err.type === 'entity.parse.failed' ? 'Invalid JSON body' : err.message);
  } else {
    console.error(err?.stack ?? String(err));
    e = new HttpError(500, 'Internal server error');
  }
  res.status(e.status).json(e.toBody());
};

const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function corsOrigin(webOrigin: string): cors.CorsOptions['origin'] {
  if (webOrigin === '*') return true;
  return (origin, cb) => cb(null, !origin || origin === webOrigin || LOCALHOST.test(origin));
}

export function createApp(c: Container, config: Pick<Config, 'webOrigin'>) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin(config.webOrigin) }));
  app.use(express.json());

  const api = express.Router();
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  api.use('/auth', authRouter(c.authService, c.auth));
  api.use('/categories', categoriesRouter(c.categories, c.auth));
  api.use('/products', productsRouter(c.products, c.auth));
  api.use('/orders', ordersRouter(c.orders, c.auth));
  api.use('/payments', paymentsRouter(c.payments, c.auth));
  api.use('/regions', regionsRouter(c.regions));
  api.use('/dashboard', dashboardRouter(c.dashboard, c.auth));
  api.use('/internal', internalRouter(c.payments, c.requireApiKey));

  app.get('/api/docs-json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use('/api', api);

  app.use((req, _res, next) => next(notFound(`Cannot ${req.method} ${req.path}`)));
  app.use(errorHandler);
  return app;
}
