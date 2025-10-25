import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^01\d{9}$/, 'Phone must be in format: 01XXXXXXXXX'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^01\d{9}$/, 'Phone must be in format: 01XXXXXXXXX'),
    password: z.string().min(1, 'Password is required'),
  }),
})

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    phone: z
      .string()
      .regex(/^01\d{9}$/, 'Phone must be in format: 01XXXXXXXXX')
      .optional(),
  }),
})

export const uploadNIDSchema = z.object({
  body: z.object({
    side: z.enum(['front', 'back']),
  }),
})
