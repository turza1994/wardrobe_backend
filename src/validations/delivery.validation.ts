import { z } from 'zod';

export const getDeliverySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid delivery ID'),
  }),
});

export const createDeliverySchema = z.object({
  body: z.object({
    orderId: z.number().int().positive(),
    fromAddress: z.string().min(1),
    toAddress: z.string().min(1),
    isReturn: z.boolean().default(false),
  }),
});

export const updateDeliveryStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid delivery ID'),
  }),
  body: z.object({
    status: z.enum(['pending', 'picked_up', 'in_transit', 'delivered', 'failed']),
    trackingId: z.string().optional(),
  }),
});
