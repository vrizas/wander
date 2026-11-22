import { z } from 'zod';

const status = z.enum(['PENDING', 'PAID', 'EXPIRED', 'CANCELLED']);

export const createOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.string(), quantity: z.int().min(1) }))
    .min(1),
  shippingAddress: z.string().min(5),
  provinceId: z.string().regex(/^\d{2}$/),
});

export const updateOrderStatusSchema = z.object({ status });
export const orderQuerySchema = z.object({ status: status.optional() });

export type CreateOrderDto = z.output<typeof createOrderSchema>;
export type OrderStatusValue = z.output<typeof status>;
