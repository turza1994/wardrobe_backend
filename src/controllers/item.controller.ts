import { Response, NextFunction } from 'express';
import { db } from '../db';
import { items, categories, users } from '../db/schema';
import { eq, and, isNull, sql, gte, lte } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/error';

export class ItemController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        categoryId,
        type,
        color,
        size,
        wearingTime,
        purchasePrice,
        description,
        sellPrice,
        rentPrice,
        availability,
        quantity,
        images,
        video,
      } = req.body;

      if (availability === 'sell_only' && !sellPrice) {
        throw new ValidationError('Sell price is required for sell_only items');
      }
      if (availability === 'rent_only' && !rentPrice) {
        throw new ValidationError('Rent price is required for rent_only items');
      }
      if (availability === 'both' && (!sellPrice || !rentPrice)) {
        throw new ValidationError('Both sell and rent prices are required for both availability');
      }

      const [item] = await db
        .insert(items)
        .values({
          sellerId: req.user!.id,
          categoryId,
          type,
          color,
          size,
          wearingTime,
          purchasePrice: purchasePrice.toString(),
          description,
          sellPrice: sellPrice ? sellPrice.toString() : null,
          rentPrice: rentPrice ? rentPrice.toString() : null,
          availability,
          quantity,
          images,
          video,
          status: 'pending_approval',
        })
        .returning();

      res.status(201).json({
        success: true,
        data: item,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        categoryId,
        type,
        color,
        size,
        minPrice,
        maxPrice,
        wearingTime,
        availability,
        status,
      } = req.query;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      let conditions = [isNull(items.deletedAt)];

      if (categoryId) {
        conditions.push(eq(items.categoryId, parseInt(categoryId as string)));
      }
      if (type) {
        conditions.push(eq(items.type, type as string));
      }
      if (color) {
        conditions.push(eq(items.color, color as string));
      }
      if (size) {
        conditions.push(eq(items.size, size as string));
      }
      if (wearingTime) {
        conditions.push(eq(items.wearingTime, wearingTime as string));
      }
      if (availability) {
        conditions.push(eq(items.availability, availability as any));
      }
      if (status) {
        conditions.push(eq(items.status, status as any));
      }
      if (minPrice) {
        conditions.push(gte(items.sellPrice, minPrice as string));
      }
      if (maxPrice) {
        conditions.push(lte(items.sellPrice, maxPrice as string));
      }

      const itemsList = await db
        .select({
          id: items.id,
          sellerId: items.sellerId,
          categoryId: items.categoryId,
          type: items.type,
          color: items.color,
          size: items.size,
          wearingTime: items.wearingTime,
          purchasePrice: items.purchasePrice,
          description: items.description,
          sellPrice: items.sellPrice,
          rentPrice: items.rentPrice,
          availability: items.availability,
          quantity: items.quantity,
          images: items.images,
          video: items.video,
          status: items.status,
          createdAt: items.createdAt,
          seller: {
            id: users.id,
            name: users.name,
          },
          category: {
            id: categories.id,
            name: categories.name,
          },
        })
        .from(items)
        .leftJoin(users, eq(items.sellerId, users.id))
        .leftJoin(categories, eq(items.categoryId, categories.id))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: itemsList,
        pagination: {
          page,
          limit,
        },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const [item] = await db
        .select({
          id: items.id,
          sellerId: items.sellerId,
          categoryId: items.categoryId,
          type: items.type,
          color: items.color,
          size: items.size,
          wearingTime: items.wearingTime,
          purchasePrice: items.purchasePrice,
          description: items.description,
          sellPrice: items.sellPrice,
          rentPrice: items.rentPrice,
          availability: items.availability,
          quantity: items.quantity,
          images: items.images,
          video: items.video,
          status: items.status,
          createdAt: items.createdAt,
          seller: {
            id: users.id,
            name: users.name,
          },
          category: {
            id: categories.id,
            name: categories.name,
          },
        })
        .from(items)
        .leftJoin(users, eq(items.sellerId, users.id))
        .leftJoin(categories, eq(items.categoryId, categories.id))
        .where(and(eq(items.id, parseInt(id)), isNull(items.deletedAt)))
        .limit(1);

      if (!item) {
        throw new NotFoundError('Item not found');
      }

      res.json({
        success: true,
        data: item,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const [item] = await db
        .select()
        .from(items)
        .where(and(eq(items.id, parseInt(id)), isNull(items.deletedAt)))
        .limit(1);

      if (!item) {
        throw new NotFoundError('Item not found');
      }

      if (item.sellerId !== req.user!.id && req.user!.role !== 'admin') {
        throw new ForbiddenError('You can only update your own items');
      }

      const updateData: any = { updatedAt: new Date() };

      const fields = [
        'type',
        'color',
        'size',
        'wearingTime',
        'purchasePrice',
        'description',
        'sellPrice',
        'rentPrice',
        'availability',
        'quantity',
        'images',
        'video',
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (['purchasePrice', 'sellPrice', 'rentPrice'].includes(field) && req.body[field] !== null) {
            updateData[field] = req.body[field].toString();
          } else {
            updateData[field] = req.body[field];
          }
        }
      });

      const [updated] = await db
        .update(items)
        .set(updateData)
        .where(eq(items.id, parseInt(id)))
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

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const [item] = await db
        .select()
        .from(items)
        .where(and(eq(items.id, parseInt(id)), isNull(items.deletedAt)))
        .limit(1);

      if (!item) {
        throw new NotFoundError('Item not found');
      }

      if (item.sellerId !== req.user!.id && req.user!.role !== 'admin') {
        throw new ForbiddenError('You can only delete your own items');
      }

      await db
        .update(items)
        .set({ deletedAt: new Date() })
        .where(eq(items.id, parseInt(id)));

      res.json({
        success: true,
        message: 'Item deleted successfully',
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
        .update(items)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(items.id, parseInt(id)), isNull(items.deletedAt)))
        .returning();

      if (!updated) {
        throw new NotFoundError('Item not found');
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
}
