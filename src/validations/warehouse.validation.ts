import { z } from 'zod';

export const getWarehouseItemSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid inventory ID'),
  }),
});

export const addToWarehouseSchema = z.object({
  body: z.object({
    itemId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    status: z.enum(['in_warehouse', 'returned_pending', 'damaged']).default('in_warehouse'),
  }),
});

export const updateWarehouseItemSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid inventory ID'),
  }),
  body: z.object({
    quantity: z.number().int().positive().optional(),
    status: z.enum(['in_warehouse', 'returned_pending', 'damaged']).optional(),
  }),
});
