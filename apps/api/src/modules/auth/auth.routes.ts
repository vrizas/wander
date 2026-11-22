import { Router } from 'express';
import type { AuthFactory } from '../../common/auth.js';
import { validate } from '../../common/validate.js';
import { loginSchema, registerSchema } from './auth.schema.js';
import type { AuthService } from './auth.service.js';

export function authRouter(service: AuthService, auth: AuthFactory) {
  const r = Router();
  r.post('/register', async (req, res) => {
    res.status(201).json(await service.register(validate(registerSchema, req.body)));
  });
  r.post('/login', async (req, res) => {
    res.status(201).json(await service.login(validate(loginSchema, req.body)));
  });
  r.get('/me', ...auth(), async (req, res) => {
    res.json(await service.me(req.user!.sub));
  });
  return r;
}
