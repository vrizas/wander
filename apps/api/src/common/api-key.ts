import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { HttpError, unauthorized } from './http-error.js';

const digest = (v: string) => createHash('sha256').update(v).digest();

export function apiKeyAuth(expected: string | undefined): RequestHandler {
  return (req, _res, next) => {
    if (!expected) throw new HttpError(503, 'Internal endpoint is disabled: set N8N_API_KEY');
    const given = req.header('x-api-key');
    if (!given || !timingSafeEqual(digest(given), digest(expected))) throw unauthorized('Invalid API key');
    next();
  };
}
