import './env.js';
import { databaseUrl } from './database-url.js';

export interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  webOrigin: string;
  midtrans: {
    serverKey: string;
    snapUrl: string;
    apiUrl: string;
  };
  n8nWebhookUrl?: string;
  n8nApiKey?: string;
  regionsApiUrl: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 3001),
    databaseUrl: databaseUrl(env) ?? '',
    jwtSecret: env.JWT_SECRET ?? '',
    webOrigin: env.WEB_ORIGIN ?? 'http://localhost:3000',
    midtrans: {
      serverKey: env.MIDTRANS_SERVER_KEY ?? '',
      snapUrl: env.MIDTRANS_SNAP_URL ?? 'https://app.sandbox.midtrans.com/snap/v1/transactions',
      apiUrl: (env.MIDTRANS_API_URL ?? 'https://api.sandbox.midtrans.com').replace(/\/$/, ''),
    },
    n8nWebhookUrl: env.N8N_WEBHOOK_URL || undefined,
    n8nApiKey: env.N8N_API_KEY || undefined,
    regionsApiUrl: env.REGIONS_API_URL ?? 'https://emsifa.github.io/api-wilayah-indonesia/api',
  };
}
