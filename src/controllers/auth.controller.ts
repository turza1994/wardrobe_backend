import { Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { authService } from '../services/auth';
import { storageService } from '../services/storage';
import { AuthRequest } from '../types';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/error';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password, address, phone } = req.body;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1);

      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      const passwordHash = await authService.hashPassword(password);

      const [user] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          address: address || null,
          phone: phone || null,
          role: 'user',
          status: 'active',
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        });

      const token = authService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        success: true,
        data: { user, token },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1);

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      if (user.status === 'suspended') {
        throw new UnauthorizedError('Your account has been suspended');
      }

      if (user.status !== 'active') {
        throw new UnauthorizedError('Your account is not active');
      }

      const isPasswordValid = await authService.comparePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const token = authService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            balance: user.balance,
          },
          token,
        },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
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
        .limit(1);

      res.json({
        success: true,
        data: user,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}
