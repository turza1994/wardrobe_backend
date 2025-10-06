import dotenv from 'dotenv'

dotenv.config()

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@sharewardrobe.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  // OTP Configuration
  OTP_STATIC_CODE: process.env.OTP_STATIC_CODE || '123456',
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
  // Phone Configuration
  PHONE_REGEX: process.env.PHONE_REGEX || '^01\\d{9}$',
  PHONE_COUNTRY_CODE: process.env.PHONE_COUNTRY_CODE || '880',
}

export function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}
