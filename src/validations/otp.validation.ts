import { z } from 'zod'

export const sendOTPSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^01\d{9}$/, 'Phone must be in format: 01XXXXXXXXX'),
    purpose: z.enum(['registration', 'login', 'password_reset']),
  }),
})

export const verifyOTPSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^01\d{9}$/, 'Phone must be in format: 01XXXXXXXXX'),
    otp: z
      .string()
      .length(6, 'OTP must be 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits'),
    purpose: z.enum(['registration', 'login', 'password_reset']),
  }),
})

export const resendOTPSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^01\d{9}$/, 'Phone must be in format: 01XXXXXXXXX'),
    purpose: z.enum(['registration', 'login', 'password_reset']),
  }),
})
