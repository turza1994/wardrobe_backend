import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'inactive', 'suspended']),
  }),
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['user', 'seller', 'user_seller', 'admin']),
  }),
});

export const verifyUserSchema = z.object({
  body: z.object({
    verificationStatus: z.enum(['approved', 'rejected']),
  }),
});

export const uploadNIDSchema = z.object({
  body: z.object({
    nidFrontUrl: z.string().url(),
    nidBackUrl: z.string().url(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid user ID'),
  }),
});
