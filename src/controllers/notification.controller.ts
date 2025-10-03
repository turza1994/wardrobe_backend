import { Response, NextFunction } from 'express';
import { db } from '../db';
import { notifications } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { AuthRequest } from '../types';

export class NotificationController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const notificationsList = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.userId, req.user!.id), isNull(notifications.deletedAt)))
        .orderBy(notifications.createdAt)
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: notificationsList,
        pagination: { page, limit },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const [updated] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, parseInt(id)), eq(notifications.userId, req.user!.id)))
        .returning();

      res.json({
        success: true,
        data: updated,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, req.user!.id));

      res.json({
        success: true,
        message: 'All notifications marked as read',
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}
