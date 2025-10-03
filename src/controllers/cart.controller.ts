import { Response, NextFunction } from 'express';
import { db } from '../db';
import { cartItems, items } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError, ValidationError, ConflictError } from '../utils/error';

export class CartController {
  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { itemId, quantity, type } = req.body;

      const [item] = await db
        .select()
        .from(items)
        .where(and(eq(items.id, itemId), isNull(items.deletedAt)))
        .limit(1);

      if (!item) {
        throw new NotFoundError('Item not found');
      }

      if (item.status !== 'available') {
        throw new ValidationError('Item is not available');
      }

      if (type === 'buy' && item.availability === 'rent_only') {
        throw new ValidationError('This item is only available for rent');
      }

      if (type === 'rent' && item.availability === 'sell_only') {
        throw new ValidationError('This item is only available for sale');
      }

      const [existing] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, req.user!.id),
            eq(cartItems.itemId, itemId),
            eq(cartItems.type, type)
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(cartItems)
          .set({ quantity: existing.quantity + quantity })
          .where(eq(cartItems.id, existing.id))
          .returning();

        return res.json({
          success: true,
          data: updated,
          message: 'Cart item quantity updated',
          requestId: req.requestId,
        });
      }

      const [cartItem] = await db
        .insert(cartItems)
        .values({
          userId: req.user!.id,
          itemId,
          quantity,
          type,
        })
        .returning();

      res.status(201).json({
        success: true,
        data: cartItem,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cart = await db
        .select({
          id: cartItems.id,
          quantity: cartItems.quantity,
          type: cartItems.type,
          negotiatedPrice: cartItems.negotiatedPrice,
          negotiatedExpiresAt: cartItems.negotiatedExpiresAt,
          addedAt: cartItems.addedAt,
          item: {
            id: items.id,
            name: items.description,
            sellPrice: items.sellPrice,
            rentPrice: items.rentPrice,
            images: items.images,
            status: items.status,
            availability: items.availability,
          },
        })
        .from(cartItems)
        .leftJoin(items, eq(cartItems.itemId, items.id))
        .where(eq(cartItems.userId, req.user!.id));

      res.json({
        success: true,
        data: cart,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const [updated] = await db
        .update(cartItems)
        .set({ quantity })
        .where(and(eq(cartItems.id, parseInt(id)), eq(cartItems.userId, req.user!.id)))
        .returning();

      if (!updated) {
        throw new NotFoundError('Cart item not found');
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

  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const [deleted] = await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, parseInt(id)), eq(cartItems.userId, req.user!.id)))
        .returning();

      if (!deleted) {
        throw new NotFoundError('Cart item not found');
      }

      res.json({
        success: true,
        message: 'Item removed from cart',
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await db.delete(cartItems).where(eq(cartItems.userId, req.user!.id));

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}
