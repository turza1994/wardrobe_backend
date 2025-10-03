import { Response, NextFunction } from 'express';
import { db } from '../db';
import { warehouseInventory, items } from '../db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError } from '../utils/error';

export class WarehouseController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status as string;

      let conditions = [isNull(warehouseInventory.deletedAt)];

      if (status) {
        conditions.push(eq(warehouseInventory.status, status as any));
      }

      const inventory = await db
        .select({
          id: warehouseInventory.id,
          itemId: warehouseInventory.itemId,
          quantity: warehouseInventory.quantity,
          status: warehouseInventory.status,
          lastUpdated: warehouseInventory.lastUpdated,
          item: {
            id: items.id,
            type: items.type,
            color: items.color,
            size: items.size,
            description: items.description,
          },
        })
        .from(warehouseInventory)
        .leftJoin(items, eq(warehouseInventory.itemId, items.id))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: inventory,
        pagination: { page, limit },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const [inventory] = await db
        .select({
          id: warehouseInventory.id,
          itemId: warehouseInventory.itemId,
          quantity: warehouseInventory.quantity,
          status: warehouseInventory.status,
          lastUpdated: warehouseInventory.lastUpdated,
          item: {
            id: items.id,
            type: items.type,
            color: items.color,
            size: items.size,
            description: items.description,
            sellPrice: items.sellPrice,
            rentPrice: items.rentPrice,
          },
        })
        .from(warehouseInventory)
        .leftJoin(items, eq(warehouseInventory.itemId, items.id))
        .where(and(eq(warehouseInventory.id, parseInt(id)), isNull(warehouseInventory.deletedAt)))
        .limit(1);

      if (!inventory) {
        throw new NotFoundError('Warehouse item not found');
      }

      res.json({
        success: true,
        data: inventory,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { itemId, quantity, status } = req.body;

      const [item] = await db
        .select()
        .from(items)
        .where(and(eq(items.id, itemId), isNull(items.deletedAt)))
        .limit(1);

      if (!item) {
        throw new NotFoundError('Item not found');
      }

      const [existing] = await db
        .select()
        .from(warehouseInventory)
        .where(and(eq(warehouseInventory.itemId, itemId), isNull(warehouseInventory.deletedAt)))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(warehouseInventory)
          .set({
            quantity: existing.quantity + quantity,
            status: status || existing.status,
            lastUpdated: new Date(),
          })
          .where(eq(warehouseInventory.id, existing.id))
          .returning();

        return res.json({
          success: true,
          data: updated,
          requestId: req.requestId,
        });
      }

      const [inventory] = await db
        .insert(warehouseInventory)
        .values({
          itemId,
          quantity,
          status: status || 'in_warehouse',
        })
        .returning();

      res.status(201).json({
        success: true,
        data: inventory,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quantity, status } = req.body;

      const updateData: any = { lastUpdated: new Date() };

      if (quantity !== undefined) {
        updateData.quantity = quantity;
      }
      if (status !== undefined) {
        updateData.status = status;
      }

      const [updated] = await db
        .update(warehouseInventory)
        .set(updateData)
        .where(and(eq(warehouseInventory.id, parseInt(id)), isNull(warehouseInventory.deletedAt)))
        .returning();

      if (!updated) {
        throw new NotFoundError('Warehouse item not found');
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

  async deleteItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await db
        .update(warehouseInventory)
        .set({ deletedAt: new Date() })
        .where(eq(warehouseInventory.id, parseInt(id)));

      res.json({
        success: true,
        message: 'Warehouse item deleted successfully',
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}
