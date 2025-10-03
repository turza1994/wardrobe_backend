import { Response, NextFunction } from 'express';
import { db } from '../db';
import { transactions, withdrawalRequests, users } from '../db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError, ValidationError } from '../utils/error';

export class TransactionController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const transactionsList = await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.userId, req.user!.id), isNull(transactions.deletedAt)))
        .orderBy(transactions.createdAt)
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: transactionsList,
        pagination: { page, limit },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestWithdrawal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const balance = parseFloat(user.balance);
      if (balance < amount) {
        throw new ValidationError('Insufficient balance');
      }

      const [withdrawal] = await db
        .insert(withdrawalRequests)
        .values({
          userId: req.user!.id,
          amount: amount.toString(),
        })
        .returning();

      await db
        .update(users)
        .set({
          balance: sql`${users.balance} - ${amount}`,
        })
        .where(eq(users.id, req.user!.id));

      await db.insert(transactions).values({
        userId: req.user!.id,
        amount: `-${amount}`,
        type: 'withdrawal',
        status: 'pending',
        description: `Withdrawal request #${withdrawal.id}`,
      });

      res.status(201).json({
        success: true,
        data: withdrawal,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWithdrawals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const withdrawalsList = await db
        .select()
        .from(withdrawalRequests)
        .where(and(eq(withdrawalRequests.userId, req.user!.id), isNull(withdrawalRequests.deletedAt)))
        .orderBy(withdrawalRequests.createdAt)
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: withdrawalsList,
        pagination: { page, limit },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async processWithdrawal(req: AuthRequest, res: Response, next: NextFunction) {
    const dbClient = db as any;

    try {
      const { id } = req.params;
      const { action } = req.body;

      const result = await dbClient.transaction(async (tx: any) => {
        const [withdrawal] = await tx
          .select()
          .from(withdrawalRequests)
          .where(and(eq(withdrawalRequests.id, parseInt(id)), isNull(withdrawalRequests.deletedAt)))
          .limit(1);

        if (!withdrawal) {
          throw new NotFoundError('Withdrawal request not found');
        }

        if (withdrawal.status !== 'pending') {
          throw new ValidationError('Withdrawal request already processed');
        }

        const [updated] = await tx
          .update(withdrawalRequests)
          .set({
            status: action === 'approve' ? 'processed' : 'rejected',
            processedAt: new Date(),
          })
          .where(eq(withdrawalRequests.id, parseInt(id)))
          .returning();

        if (action === 'reject') {
          await tx
            .update(users)
            .set({
              balance: sql`${users.balance} + ${withdrawal.amount}`,
            })
            .where(eq(users.id, withdrawal.userId));
        }

        await tx
          .update(transactions)
          .set({
            status: action === 'approve' ? 'completed' : 'failed',
          })
          .where(
            and(
              eq(transactions.userId, withdrawal.userId),
              eq(transactions.type, 'withdrawal'),
              sql`${transactions.description} LIKE '%#${withdrawal.id}%'`
            )
          );

        return updated;
      });

      res.json({
        success: true,
        data: result,
        message: `Withdrawal ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllWithdrawals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status as string;

      let conditions = [isNull(withdrawalRequests.deletedAt)];

      if (status) {
        conditions.push(eq(withdrawalRequests.status, status as any));
      }

      const withdrawalsList = await db
        .select({
          id: withdrawalRequests.id,
          userId: withdrawalRequests.userId,
          amount: withdrawalRequests.amount,
          status: withdrawalRequests.status,
          processedAt: withdrawalRequests.processedAt,
          createdAt: withdrawalRequests.createdAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(withdrawalRequests)
        .leftJoin(users, eq(withdrawalRequests.userId, users.id))
        .where(and(...conditions))
        .orderBy(withdrawalRequests.createdAt)
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: withdrawalsList,
        pagination: { page, limit },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}
