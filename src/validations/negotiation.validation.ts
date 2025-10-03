import { z } from 'zod';

export const createNegotiationSchema = z.object({
  body: z.object({
    itemId: z.number().int().positive(),
    offerPrice: z.number().positive(),
    expiresAt: z.string().datetime().optional(),
  }),
});

export const respondToNegotiationSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
  body: z.object({
    status: z.enum(['accepted', 'rejected']),
  }),
});
