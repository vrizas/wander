import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.int().min(0),
  stock: z.int().min(0),
  imageUrl: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});

export type CreateProductDto = z.output<typeof createProductSchema>;
export type UpdateProductDto = z.output<typeof updateProductSchema>;
export type ProductQuery = z.output<typeof productQuerySchema>;
