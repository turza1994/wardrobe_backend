import { Response, NextFunction } from 'express'
import { db } from '../db'
import { users, otpVerifications } from '../db/schema'
import { eq, and, isNull, gte } from 'drizzle-orm'
import { authService } from '../services/auth'
import { notificationService } from '../services/notification'
import { AuthRequest } from '../types'
import { ConflictError, ValidationError, NotFoundError } from '../utils/error'

export class OTPController {
  async sendOTP(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phone, purpose } = req.body

      // Validate Bangladesh phone number
      if (!/^01\d{9}$/.test(phone)) {
        throw new ValidationError(
          'Invalid phone number format. Use: 01XXXXXXXXX'
        )
      }

      // Check if phone exists for registration
      if (purpose === 'registration') {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.phone, phone))
          .limit(1)
        if (existing) {
          throw new ConflictError('Phone number already registered')
        }
      }

      // For demo: static OTP
      const otp = '123456'

      // Store or update OTP (expires in 5 minutes)
      await db
        .insert(otpVerifications)
        .values({
          phone,
          otp,
          purpose,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        })
        .onConflictDoUpdate({
          target: [otpVerifications.phone, otpVerifications.purpose],
          set: {
            otp,
            status: 'pending',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0,
          },
        })

      // Demo SMS service
      await notificationService.sendSMS({
        to: phone,
        message: `Your ShareWardrobe OTP is: ${otp}`,
      })

      res.json({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300,
      })
    } catch (error) {
      next(error)
    }
  }

  async verifyOTP(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phone, otp, purpose } = req.body

      // Find valid OTP
      const [otpRecord] = await db
        .select()
        .from(otpVerifications)
        .where(
          and(
            eq(otpVerifications.phone, phone),
            eq(otpVerifications.otp, otp),
            eq(otpVerifications.purpose, purpose),
            eq(otpVerifications.status, 'pending'),
            gte(otpVerifications.expiresAt, new Date())
          )
        )
        .limit(1)

      if (!otpRecord) {
        throw new ValidationError('Invalid or expired OTP')
      }

      // Mark OTP as verified
      await db
        .update(otpVerifications)
        .set({
          status: 'verified',
          verifiedAt: new Date(),
        })
        .where(eq(otpVerifications.id, otpRecord.id))

      if (purpose === 'registration') {
        // Create user after OTP verification
        const tempPassword = `temp_${Date.now()}`
        const passwordHash = await authService.hashPassword(tempPassword)

        const [user] = await db
          .insert(users)
          .values({
            phone,
            passwordHash,
            phoneVerified: true,
            phoneVerifiedAt: new Date(),
          })
          .returning({
            id: users.id,
            name: users.name,
            phone: users.phone,
            email: users.email,
            role: users.role,
          })

        const token = authService.generateToken({
          userId: user.id,
          email: user.phone || '', // Use phone as email for token
          role: user.role,
        })

        res.json({
          success: true,
          message: 'Phone verified and registration completed',
          token,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            phoneVerified: true,
          },
        })
      } else if (purpose === 'login') {
        // Phone verification for existing user
        await db
          .update(users)
          .set({
            phoneVerified: true,
            phoneVerifiedAt: new Date(),
          })
          .where(eq(users.phone, phone))

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.phone, phone))
          .limit(1)

        const token = authService.generateToken({
          userId: user.id,
          email: user.phone || '', // Use phone as email for token
          role: user.role,
        })

        res.json({
          success: true,
          message: 'Phone verified successfully',
          token,
        })
      }
    } catch (error) {
      next(error)
    }
  }

  async resendOTP(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phone, purpose } = req.body

      // Validate Bangladesh phone number
      if (!/^01\d{9}$/.test(phone)) {
        throw new ValidationError(
          'Invalid phone number format. Use: 01XXXXXXXXX'
        )
      }

      // For demo: static OTP
      const otp = '123456'

      // Update existing OTP or create new one
      await db
        .insert(otpVerifications)
        .values({
          phone,
          otp,
          purpose,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        })
        .onConflictDoUpdate({
          target: [otpVerifications.phone, otpVerifications.purpose],
          set: {
            otp,
            status: 'pending',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0,
          },
        })

      // Demo SMS service
      await notificationService.sendSMS({
        to: phone,
        message: `Your ShareWardrobe OTP is: ${otp}`,
      })

      res.json({
        success: true,
        message: 'OTP resent successfully',
        expiresIn: 300,
      })
    } catch (error) {
      next(error)
    }
  }
}
