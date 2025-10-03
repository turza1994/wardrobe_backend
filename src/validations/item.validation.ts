import { z } from 'zod';

export const createItemSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive(),
    type: z.string().min(1),
    color: z.string().optional(),
    size: z.string().optional(),
    wearingTime: z.string().optional(),
    purchasePrice: z.number().nonnegative(),
    description: z.string().min(10),
    sellPrice: z.number().nonnegative().optional(),
    rentPrice: z.number().nonnegative().optional(),
    availability: z.enum(['sell_only', 'rent_only', 'both']),
    quantity: z.number().int().positive().default(1),
    images: z.array(z.string()).min(1).max(5),
    video: z.string().optional(),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
  body: z.object({
    type: z.string().min(1).optional(),
    color: z.string().optional(),
    size: z.string().optional(),
    wearingTime: z.string().optional(),
    purchasePrice: z.number().nonnegative().optional(),
    description: z.string().min(10).optional(),
    sellPrice: z.number().nonnegative().optional(),
    rentPrice: z.number().nonnegative().optional(),
    availability: z.enum(['sell_only', 'rent_only', 'both']).optional(),
    quantity: z.number().int().positive().optional(),
    images: z.array(z.string()).min(1).max(5).optional(),
    video: z.string().optional(),
  }),
});
