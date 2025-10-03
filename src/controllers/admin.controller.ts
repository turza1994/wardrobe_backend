import { Response, NextFunction } from 'express';
import { db } from '../db';
import { adminConfigs, transactions, warehouseInventory, items } from '../db/schema';
import { eq, and, gte, lte, isNull, sql } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError } from '../utils/error';

export class AdminController {
  async getConfig(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;

      const [config] = await db
        .select()
        .from(adminConfigs)
        .where(eq(adminConfigs.key, key))
        .limit(1);

      if (!config) {
        throw new NotFoundError(`Config key '${key}' not found`);
      }

      res.json({
        success: true,
        data: config,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllConfigs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const configs = await db.select().from(adminConfigs);

      res.json({
        success: true,
        data: configs,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateConfig(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { value, description } = req.body;

      const [updated] = await db
        .update(adminConfigs)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(adminConfigs.key, key))
        .returning();

      if (!updated) {
        const [created] = await db
          .insert(adminConfigs)
          .values({ key, value, description })
          .returning();

        return res.status(201).json({
          success: true,
          data: created,
          message: 'Config created',
          requestId: req.requestId,
        });
      }

      res.json({
        success: true,
        data: updated,
        message: 'Config updated',
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRevenueReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, type } = req.query;

      let conditions = [isNull(transactions.deletedAt), eq(transactions.type, 'fee' as any)];

      if (startDate) {
        conditions.push(gte(transactions.createdAt, new Date(startDate as string)));
      }
      if (endDate) {
        conditions.push(lte(transactions.createdAt, new Date(endDate as string)));
      }

      const revenues = await db
        .select({
          type: transactions.type,
          totalAmount: sql<number>`SUM(${transactions.amount})::numeric`,
          count: sql<number>`COUNT(*)::integer`,
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(transactions.type);

      const totalRevenue = revenues.reduce(
        (sum, r) => sum + parseFloat(r.totalAmount.toString()),
        0
      );

      res.json({
        success: true,
        data: {
          revenues,
          totalRevenue,
          period: { startDate, endDate },
        },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactionLedger(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const { type, status, startDate, endDate } = req.query;

      let conditions = [isNull(transactions.deletedAt)];

      if (type) {
        conditions.push(eq(transactions.type, type as any));
      }
      if (status) {
        conditions.push(eq(transactions.status, status as any));
      }
      if (startDate) {
        conditions.push(gte(transactions.createdAt, new Date(startDate as string)));
      }
      if (endDate) {
        conditions.push(lte(transactions.createdAt, new Date(endDate as string)));
      }

      const ledger = await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(transactions.createdAt)
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: ledger,
        pagination: { page, limit },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryTurnover(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const inventory = await db
        .select({
          itemId: warehouseInventory.itemId,
          quantity: warehouseInventory.quantity,
          status: warehouseInventory.status,
          lastUpdated: warehouseInventory.lastUpdated,
          item: {
            id: items.id,
            type: items.type,
            description: items.description,
          },
        })
        .from(warehouseInventory)
        .leftJoin(items, eq(warehouseInventory.itemId, items.id))
        .where(isNull(warehouseInventory.deletedAt));

      const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
      const statusCounts = inventory.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + i.quantity;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        success: true,
        data: {
          inventory,
          summary: {
            totalItems,
            statusCounts,
          },
        },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}
