import { Response, NextFunction } from 'express';
import { db } from '../db';
import { negotiations, items, cartItems, adminConfigs } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/error';

export class NegotiationController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { itemId, offerPrice, expiresAt } = req.body;

      const [item] = await db
        .select()
        .from(items)
        .where(and(eq(items.id, itemId), isNull(items.deletedAt)))
        .limit(1);

      if (!item) {
        throw new NotFoundError('Item not found');
      }

      if (item.sellerId === req.user!.id) {
        throw new ValidationError('You cannot negotiate on your own items');
      }

      const [negotiation] = await db
        .insert(negotiations)
        .values({
          itemId,
          buyerId: req.user!.id,
          offerPrice: offerPrice.toString(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        })
        .returning();

      res.status(201).json({
        success: true,
        data: negotiation,
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

      const negotiationsList = await db
        .select({
          id: negotiations.id,
          offerPrice: negotiations.offerPrice,
          status: negotiations.status,
          expiresAt: negotiations.expiresAt,
          createdAt: negotiations.createdAt,
          item: {
            id: items.id,
            description: items.description,
            sellPrice: items.sellPrice,
            rentPrice: items.rentPrice,
          },
        })
        .from(negotiations)
        .leftJoin(items, eq(negotiations.itemId, items.id))
        .where(
          and(
            eq(negotiations.buyerId, req.user!.id),
            isNull(negotiations.deletedAt)
          )
        )
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: negotiationsList,
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

      const [negotiation] = await db
        .select()
        .from(negotiations)
        .where(and(eq(negotiations.id, parseInt(id)), isNull(negotiations.deletedAt)))
        .limit(1);

      if (!negotiation) {
        throw new NotFoundError('Negotiation not found');
      }

      res.json({
        success: true,
        data: negotiation,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async respond(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const [negotiation] = await db
        .select()
        .from(negotiations)
        .where(and(eq(negotiations.id, parseInt(id)), isNull(negotiations.deletedAt)))
        .limit(1);

      if (!negotiation) {
        throw new NotFoundError('Negotiation not found');
      }

      const [item] = await db
        .select()
        .from(items)
        .where(eq(items.id, negotiation.itemId))
        .limit(1);

      if (!item || item.sellerId !== req.user!.id) {
        throw new ForbiddenError('You can only respond to negotiations on your own items');
      }

      const [updated] = await db
        .update(negotiations)
        .set({ status, updatedAt: new Date() })
        .where(eq(negotiations.id, parseInt(id)))
        .returning();

      if (status === 'accepted') {
        const [config] = await db
          .select()
          .from(adminConfigs)
          .where(eq(adminConfigs.key, 'negotiation_hold_minutes'))
          .limit(1);

        const holdMinutes = config ? parseInt(config.value) : 1440;
        const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

        await db
          .insert(cartItems)
          .values({
            userId: negotiation.buyerId,
            itemId: negotiation.itemId,
            quantity: 1,
            type: 'buy',
            negotiatedPrice: negotiation.offerPrice,
            negotiatedExpiresAt: expiresAt,
            negotiationId: negotiation.id,
          })
          .onConflictDoUpdate({
            target: [cartItems.userId, cartItems.itemId, cartItems.type],
            set: {
              negotiatedPrice: negotiation.offerPrice,
              negotiatedExpiresAt: expiresAt,
              negotiationId: negotiation.id,
            },
          });
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
