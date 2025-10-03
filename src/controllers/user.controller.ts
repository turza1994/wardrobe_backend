import { Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/error';
import { storageService } from '../services/storage';

export class UserController {
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

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
        .where(and(eq(users.id, parseInt(id)), isNull(users.deletedAt)))
        .limit(1);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (req.user!.role !== 'admin' && req.user!.id !== user.id) {
        throw new ForbiddenError('You can only view your own profile');
      }

      res.json({
        success: true,
        data: user,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const usersList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          balance: users.balance,
          verificationStatus: users.verificationStatus,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(isNull(users.deletedAt))
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: usersList,
        pagination: { page, limit },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const [updated] = await db
        .update(users)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(users.id, parseInt(id)), isNull(users.deletedAt)))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
        });

      if (!updated) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: updated,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const [updated] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(and(eq(users.id, parseInt(id)), isNull(users.deletedAt)))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        });

      if (!updated) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: updated,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadNID(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { nidFrontUrl, nidBackUrl } = req.body;

      const [updated] = await db
        .update(users)
        .set({
          nidFrontUrl,
          nidBackUrl,
          verificationStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user!.id))
        .returning({
          id: users.id,
          verificationStatus: users.verificationStatus,
          nidFrontUrl: users.nidFrontUrl,
          nidBackUrl: users.nidBackUrl,
        });

      res.json({
        success: true,
        data: updated,
        message: 'NID uploaded successfully. Verification pending.',
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { verificationStatus } = req.body;

      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, parseInt(id)), isNull(users.deletedAt)))
        .limit(1);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (!user.nidFrontUrl || !user.nidBackUrl) {
        throw new ValidationError('User has not uploaded NID documents');
      }

      const [updated] = await db
        .update(users)
        .set({ verificationStatus, updatedAt: new Date() })
        .where(eq(users.id, parseInt(id)))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          verificationStatus: users.verificationStatus,
        });

      res.json({
        success: true,
        data: updated,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}
