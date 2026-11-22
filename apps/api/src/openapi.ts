type Method = 'get' | 'post' | 'patch' | 'delete';
interface Op {
  tag: string;
  auth?: 'user' | 'admin' | 'key';
  body?: Record<string, string>;
  query?: string[];
  status?: number;
}

const typeOf = (t: string) => ({ type: t.replace('?', '') === 'int' ? 'integer' : t.replace('?', '') });

function op(o: Op) {
  const params = [
    ...(o.query ?? []).map((name) => ({ name, in: 'query', required: false, schema: { type: 'string' } })),
  ];
  return {
    tags: [o.tag],
    ...(o.auth
      ? {
          security: [o.auth === 'key' ? { apiKey: [] } : { bearer: [] }],
          description: { admin: 'ADMIN only', user: 'Login required', key: 'n8n only: header x-api-key = N8N_API_KEY' }[o.auth],
        }
      : {}),
    ...(params.length ? { parameters: params } : {}),
    ...(o.body
      ? {
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: Object.fromEntries(Object.entries(o.body).map(([k, t]) => [k, typeOf(t)])),
                  required: Object.entries(o.body).filter(([, t]) => !t.endsWith('?')).map(([k]) => k),
                },
              },
            },
          },
        }
      : {}),
    responses: { [o.status ?? 200]: { description: 'OK' }, '400': { description: 'Validation failed' } },
  };
}

const idParam = (name: string) => ({ name, in: 'path', required: true, schema: { type: 'string' } });
const paths: Record<string, Partial<Record<Method, ReturnType<typeof op>>>> = {};
function add(path: string, method: Method, o: Op) {
  const item = (paths[path] ??= {});
  const built = op(o) as ReturnType<typeof op> & { parameters?: unknown[] };
  const pathParams = [...path.matchAll(/\{(\w+)\}/g)].map((m) => idParam(m[1]!));
  if (pathParams.length) built.parameters = [...pathParams, ...(built.parameters ?? [])];
  item[method] = built;
}

add('/auth/register', 'post', { tag: 'auth', status: 201, body: { email: 'string', name: 'string', password: 'string' } });
add('/auth/login', 'post', { tag: 'auth', status: 201, body: { email: 'string', password: 'string' } });
add('/auth/me', 'get', { tag: 'auth', auth: 'user' });

add('/categories', 'get', { tag: 'categories' });
add('/categories', 'post', { tag: 'categories', auth: 'admin', status: 201, body: { name: 'string' } });
add('/categories/{id}', 'patch', { tag: 'categories', auth: 'admin', body: { name: 'string' } });
add('/categories/{id}', 'delete', { tag: 'categories', auth: 'admin', status: 204 });

const productBody = { name: 'string', description: 'string?', price: 'int', stock: 'int', imageUrl: 'string?', categoryId: 'string?', isActive: 'boolean?' };
add('/products', 'get', { tag: 'products', query: ['search', 'category', 'lowStock', 'page', 'limit'] });
add('/products/admin/list', 'get', { tag: 'products', auth: 'admin', query: ['search', 'category', 'lowStock', 'page', 'limit'] });
add('/products/{slug}', 'get', { tag: 'products' });
add('/products', 'post', { tag: 'products', auth: 'admin', status: 201, body: productBody });
add('/products/{id}', 'patch', { tag: 'products', auth: 'admin', body: Object.fromEntries(Object.entries(productBody).map(([k, t]) => [k, t.endsWith('?') ? t : `${t}?`])) });
add('/products/{id}', 'delete', { tag: 'products', auth: 'admin', status: 204 });

add('/orders', 'post', { tag: 'orders', auth: 'user', status: 201, body: { items: 'array', shippingAddress: 'string', provinceId: 'string' } });
add('/orders/me', 'get', { tag: 'orders', auth: 'user' });
add('/orders', 'get', { tag: 'orders', auth: 'admin', query: ['status'] });
add('/orders/{id}', 'get', { tag: 'orders', auth: 'user' });
add('/orders/{id}/status', 'patch', { tag: 'orders', auth: 'admin', body: { status: 'string' } });

add('/payments/orders/{orderId}/snap', 'post', { tag: 'payments', auth: 'user', status: 201 });
add('/payments/orders/{orderId}/sync', 'post', { tag: 'payments', auth: 'user' });
add('/payments/notification', 'post', { tag: 'payments', body: { order_id: 'string', status_code: 'string', gross_amount: 'string', signature_key: 'string', transaction_status: 'string' } });

add('/regions/provinces', 'get', { tag: 'regions' });
add('/regions/provinces/{id}/regencies', 'get', { tag: 'regions' });
add('/regions/shipping-estimate', 'get', { tag: 'regions', query: ['provinceId'] });

add('/internal/reconcile-payments', 'post', { tag: 'internal', auth: 'key' });
add('/dashboard', 'get', { tag: 'dashboard', auth: 'admin' });
add('/health', 'get', { tag: 'system' });

export const openApiDocument = {
  openapi: '3.0.3',
  info: { title: 'Shop API', description: 'REST API toko online + CMS (implementasi Express)', version: '1.0' },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
    },
  },
  paths,
};
