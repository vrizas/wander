import bcrypt from 'bcryptjs';
import { signToken } from '../../common/auth.js';
import { conflict, unauthorized } from '../../common/http-error.js';
import type { PrismaClient } from '../../prisma.js';
import type { z } from 'zod';
import type { loginSchema, registerSchema } from './auth.schema.js';

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private jwtSecret: string,
  ) {}

  async register(dto: z.output<typeof registerSchema>) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw conflict('Email already registered');
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, password: await bcrypt.hash(dto.password, 10) },
    });
    return this.issue(user);
  }

  async login(dto: z.output<typeof loginSchema>) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw unauthorized('Invalid email or password');
    }
    return this.issue(user);
  }

  me(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  private issue(user: { id: string; email: string; name: string; role: string }) {
    return {
      accessToken: signToken(this.jwtSecret, user),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
