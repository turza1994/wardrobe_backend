import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    itemId: z.number().int().positive(),
    quantity: z.number().int().positive().default(1),
    type: z.enum(['buy', 'rent']),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
  body: z.object({
    quantity: z.number().int().positive(),
  }),
});

export const removeFromCartSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});
