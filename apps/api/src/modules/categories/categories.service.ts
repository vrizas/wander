import { slugify } from '../../common/slugify.js';
import type { PrismaClient } from '../../prisma.js';

export class CategoriesService {
  constructor(private prisma: PrismaClient) {}

  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: { name: string }) {
    return this.prisma.category.create({ data: { name: dto.name, slug: slugify(dto.name) } });
  }

  update(id: string, dto: { name: string }) {
    return this.prisma.category.update({ where: { id }, data: { name: dto.name, slug: slugify(dto.name) } });
  }

  async remove(id: string) {
    await this.prisma.$transaction([
      this.prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
      this.prisma.category.delete({ where: { id } }),
    ]);
  }
}
