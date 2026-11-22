import { notFound } from '../../common/http-error.js';
import { slugify } from '../../common/slugify.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { PrismaClient } from '../../prisma.js';
import type { CreateProductDto, ProductQuery, UpdateProductDto } from './products.schema.js';

export const LOW_STOCK_THRESHOLD = 5;

export class ProductsService {
  constructor(private prisma: PrismaClient) {}

  async list(q: ProductQuery, includeInactive = false) {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 12, 100);
    const where: Prisma.ProductWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
      ...(q.category ? { category: { slug: q.category } } : {}),
      ...(q.lowStock === 'true' ? { stock: { lte: LOW_STOCK_THRESHOLD } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug }, include: { category: true } });
    if (!product || !product.isActive) throw notFound('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto, slug: await this.uniqueSlug(dto.name) } });
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw notFound('Product not found');
    const slug = dto.name && dto.name !== existing.name ? await this.uniqueSlug(dto.name) : undefined;
    return this.prisma.product.update({ where: { id }, data: { ...dto, slug } });
  }

  async remove(id: string) {
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  private async uniqueSlug(name: string) {
    const base = slugify(name) || 'produk';
    let slug = base;
    for (let i = 2; await this.prisma.product.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
    return slug;
  }
}
