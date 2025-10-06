import { Response, NextFunction } from 'express'
import { db } from '../db'
import { users, otpVerifications } from '../db/schema'
import { eq, and, isNull, gte } from 'drizzle-orm'
import { authService } from '../services/auth'
import { storageService } from '../services/storage'
import { notificationService } from '../services/notification'
import { AuthRequest } from '../types'
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../utils/error'

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phone, password, name, email, address } = req.body

      // Check if phone already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(eq(users.phone, phone), isNull(users.deletedAt)))
        .limit(1)

      if (existingUser) {
        throw new ConflictError('Phone number already registered')
      }

      const passwordHash = await authService.hashPassword(password)

      // Create user (no role assignment - defaults to 'user')
      const [user] = await db
        .insert(users)
        .values({
          phone,
          passwordHash,
          name: name || null,
          email: email || null,
          address: address || null,
          phoneVerified: false, // Will be verified via OTP
        })
        .returning({
          id: users.id,
          name: users.name,
          phone: users.phone,
          role: users.role,
        })

      // Generate temp token for OTP verification
      const tempToken = authService.generateToken({
        userId: user.id,
        email: user.phone || '', // Use phone as email for token (temp solution)
        role: user.role,
      })

      res.status(201).json({
        success: true,
        data: {
          user,
          tempToken,
          requiresPhoneVerification: true,
        },
        requestId: req.requestId,
      })
    } catch (error) {
      next(error)
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phone, password } = req.body

      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.phone, phone), isNull(users.deletedAt)))
        .limit(1)

      if (!user) {
        throw new UnauthorizedError('Invalid phone or password')
      }

      if (user.status === 'suspended') {
        throw new UnauthorizedError('Your account has been suspended')
      }

      if (user.status !== 'active') {
        throw new UnauthorizedError('Your account is not active')
      }

      const isPasswordValid = await authService.comparePassword(
        password,
        user.passwordHash
      )

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid phone or password')
      }

      const token = authService.generateToken({
        userId: user.id,
        email: user.phone || '', // Use phone as email for token
        role: user.role,
      })

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            phoneVerified: user.phoneVerified,
            balance: user.balance,
          },
          token,
        },
        requestId: req.requestId,
      })
    } catch (error) {
      next(error)
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, address, phone } = req.body

      const updateData: any = {
        updatedAt: new Date(),
      }

      if (name !== undefined) updateData.name = name
      if (email !== undefined) updateData.email = email
      if (address !== undefined) updateData.address = address
      if (phone !== undefined) updateData.phone = phone

      const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, req.user!.id))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          status: users.status,
          address: users.address,
          balance: users.balance,
          verificationStatus: users.verificationStatus,
          createdAt: users.createdAt,
        })

      res.json({
        success: true,
        data: updated,
        requestId: req.requestId,
      })
    } catch (error) {
      next(error)
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          address: users.address,
          phone: users.phone,
          balance: users.balance,
          verificationStatus: users.verificationStatus,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1)

      res.json({
        success: true,
        data: user,
        requestId: req.requestId,
      })
    } catch (error) {
      next(error)
    }
  }
}
