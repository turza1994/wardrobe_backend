import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['cod', 'online']),
    deliveryAddress: z.string().min(10),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
  body: z.object({
    status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'returned', 'partially_returned', 'cancelled', 'refunded']),
  }),
});
