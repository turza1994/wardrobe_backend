import { z } from 'zod';

export const getRentalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid rental ID'),
  }),
});

export const initiateReturnSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid rental ID'),
  }),
});

export const inspectRentalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid rental ID'),
  }),
  body: z.object({
    inspectionResult: z.string().min(1),
    refundAmount: z.number().min(0),
    lateFee: z.number().min(0).default(0),
  }),
});
