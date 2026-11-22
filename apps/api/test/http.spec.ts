import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { apiKeyAuth } from '../src/common/api-key.js';
import { createAuth, signToken } from '../src/common/auth.js';
import type { Container } from '../src/container.js';

const SECRET = 'test-secret';
const token = (role: 'ADMIN' | 'CUSTOMER') => signToken(SECRET, { id: 'u1', email: 'u@x.y', role });

function makeApp(apiKey: string | null = 'kunci-rahasia-n8n') {
  const services = {
    auth: createAuth(SECRET),
    requireApiKey: apiKeyAuth(apiKey ?? undefined),
    regions: {},
    authService: { register: vi.fn(), login: vi.fn(), me: vi.fn() },
    categories: { list: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
    products: {
      list: vi.fn().mockResolvedValue({ items: [] }),
      create: vi.fn().mockResolvedValue({ id: 'p1' }),
      getBySlug: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    orders: { create: vi.fn().mockResolvedValue({ id: 'o1' }), listMine: vi.fn(), listAll: vi.fn(), get: vi.fn(), setStatus: vi.fn() },
    payments: { createSnap: vi.fn(), handleNotification: vi.fn(), reconcile: vi.fn().mockResolvedValue({ checked: 0, skipped: 0, updated: [], errors: [] }) },
    dashboard: { stats: vi.fn() },
  };
  return { services, app: createApp(services as unknown as Container, { webOrigin: 'http://localhost:3000' }) };
}

describe('HTTP layer', () => {
  it('public endpoints do not require a token', async () => {
    const { app } = makeApp();
    await request(app).get('/api/categories').expect(200, []);
    await request(app).get('/api/health').expect(200, { status: 'ok' });
  });

  it('401 without a token or with a malformed token, using a consistent error body', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/orders/me').expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: 'Missing token', error: 'Unauthorized' });
    await request(app).get('/api/orders/me').set('authorization', 'Bearer rusak').expect(401);
  });

  it('403 for CUSTOMER on admin endpoints, allowed for ADMIN', async () => {
    const { app, services } = makeApp();
    await request(app).post('/api/products').set('authorization', `Bearer ${token('CUSTOMER')}`).send({}).expect(403);
    await request(app)
      .post('/api/products')
      .set('authorization', `Bearer ${token('ADMIN')}`)
      .send({ name: 'Lampu', price: 1000, stock: 3 })
      .expect(201);
    expect(services.products.create).toHaveBeenCalledWith({ name: 'Lampu', price: 1000, stock: 3 });
  });

  it('400 with a list of messages when validation fails, without calling the service', async () => {
    const { app, services } = makeApp();
    const res = await request(app)
      .post('/api/orders')
      .set('authorization', `Bearer ${token('CUSTOMER')}`)
      .send({ items: [], shippingAddress: 'x', provinceId: 'abc' })
      .expect(400);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.message.length).toBeGreaterThanOrEqual(3);
    expect(services.orders.create).not.toHaveBeenCalled();
  });

  it('fields outside the schema are stripped and malformed JSON returns 400', async () => {
    const { app, services } = makeApp();
    await request(app)
      .post('/api/products')
      .set('authorization', `Bearer ${token('ADMIN')}`)
      .send({ name: 'A', price: 1, stock: 1, slug: 'hack', role: 'ADMIN' })
      .expect(201);
    expect(services.products.create).toHaveBeenCalledWith({ name: 'A', price: 1, stock: 1 });
    await request(app).post('/api/auth/login').set('content-type', 'application/json').send('{bad').expect(400);
  });

  it('webhook without a signature field is rejected with 401, unknown route returns 404', async () => {
    const { app } = makeApp();
    await request(app).post('/api/payments/notification').send({ foo: 'bar' }).expect(401);
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.error).toBe('Not Found');
  });

  it('internal endpoint: 401 without or with a wrong key, 200 with the correct key', async () => {
    const { app, services } = makeApp();
    await request(app).post('/api/internal/reconcile-payments').expect(401);
    await request(app).post('/api/internal/reconcile-payments').set('x-api-key', 'wrong').expect(401);
    await request(app).post('/api/internal/reconcile-payments').set('authorization', `Bearer ${token('ADMIN')}`).expect(401);
    expect(services.payments.reconcile).not.toHaveBeenCalled();
    await request(app).post('/api/internal/reconcile-payments').set('x-api-key', 'kunci-rahasia-n8n').expect(200);
    expect(services.payments.reconcile).toHaveBeenCalledOnce();
  });

  it('internal endpoint is disabled (503) when N8N_API_KEY is not set, instead of being open', async () => {
    const { app } = makeApp(null);
    await request(app).post('/api/internal/reconcile-payments').set('x-api-key', 'apa-saja').expect(503);
  });

  it('an unexpected error returns 500 without leaking details', async () => {
    const { app, services } = makeApp();
    services.categories.list.mockRejectedValue(new Error('db password=secret'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/api/categories').expect(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});
