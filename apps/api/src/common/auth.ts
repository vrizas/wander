import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '../generated/prisma/enums.js';
import { forbidden, unauthorized } from './http-error.js';

export interface AuthUser {
  sub: string;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const signToken = (secret: string, user: { id: string; email: string; role: string }) =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });

export function createAuth(secret: string) {
  const authenticate: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
    const [type, token] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) throw unauthorized('Missing token');
    try {
      req.user = jwt.verify(token, secret) as unknown as AuthUser;
    } catch {
      throw unauthorized('Invalid token');
    }
    next();
  };

  return (...roles: Role[]): RequestHandler[] => [
    authenticate,
    (req, _res, next) => {
      if (roles.length && !roles.includes(req.user!.role)) throw forbidden('Access denied');
      next();
    },
  ];
}

export type AuthFactory = ReturnType<typeof createAuth>;
