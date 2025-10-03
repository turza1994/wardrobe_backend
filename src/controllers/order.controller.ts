import { Response, NextFunction } from 'express';
import { db } from '../db';
import {
  orders,
  orderItems,
  cartItems,
  items,
  adminConfigs,
  transactions,
  users,
} from '../db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError, ValidationError } from '../utils/error';
import { paymentService } from '../services/payment';
import { deliveryService } from '../services/delivery';

export class OrderController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    const dbClient = db as any;

    try {
      const { paymentMethod, deliveryAddress } = req.body;

      const result = await dbClient.transaction(async (tx: any) => {
        const cart = await tx
          .select()
          .from(cartItems)
          .where(eq(cartItems.userId, req.user!.id));

        if (cart.length === 0) {
          throw new ValidationError('Cart is empty');
        }

        const [deliveryChargeConfig] = await tx
          .select()
          .from(adminConfigs)
          .where(eq(adminConfigs.key, 'delivery_charge_per_order'))
          .limit(1);

        const deliveryCharge = deliveryChargeConfig
          ? parseFloat(deliveryChargeConfig.value)
          : 100.0;

        let totalAmount = deliveryCharge;
        let safetyDeposit = 0;

        const itemsData = [];

        for (const cartItem of cart) {
          const [item] = await tx
            .select()
            .from(items)
            .where(and(eq(items.id, cartItem.itemId), isNull(items.deletedAt)))
            .limit(1)
            .for('update');

          if (!item) {
            throw new NotFoundError(`Item ${cartItem.itemId} not found`);
          }

          if (item.quantity < cartItem.quantity) {
            throw new ValidationError(
              `Insufficient quantity for item ${item.id}. Available: ${item.quantity}, Requested: ${cartItem.quantity}`
            );
          }

          const price =
            cartItem.negotiatedPrice ||
            (cartItem.type === 'buy' ? item.sellPrice : item.rentPrice);

          if (!price) {
            throw new ValidationError(`Price not available for item ${item.id}`);
          }

          const itemTotal = parseFloat(price) * cartItem.quantity;
          totalAmount += itemTotal;

          if (cartItem.type === 'rent') {
            const [depositConfig] = await tx
              .select()
              .from(adminConfigs)
              .where(eq(adminConfigs.key, 'safety_deposit_percentage'))
              .limit(1);

            const depositPercent = depositConfig
              ? parseFloat(depositConfig.value)
              : 30;

            safetyDeposit += (itemTotal * depositPercent) / 100;
          }

          itemsData.push({
            item,
            cartItem,
            price,
          });
        }

        const [timeoutConfig] = await tx
          .select()
          .from(adminConfigs)
          .where(eq(adminConfigs.key, 'payment_timeout_minutes'))
          .limit(1);

        const timeoutMinutes = timeoutConfig ? parseInt(timeoutConfig.value) : 1440;
        const paymentDueAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

        const [order] = await tx
          .insert(orders)
          .values({
            buyerId: req.user!.id,
            totalAmount: totalAmount.toString(),
            deliveryCharge: deliveryCharge.toString(),
            safetyDeposit: safetyDeposit.toString(),
            paymentMethod,
            status: 'pending',
            paymentDueAt,
            deliveryChargePaid: false,
          })
          .returning();

        for (const { item, cartItem, price } of itemsData) {
          await tx.insert(orderItems).values({
            orderId: order.id,
            itemId: item.id,
            quantity: cartItem.quantity,
            price,
            type: cartItem.type,
          });

          await tx
            .update(items)
            .set({
              quantity: item.quantity - cartItem.quantity,
            })
            .where(eq(items.id, item.id));
        }

        await tx.delete(cartItems).where(eq(cartItems.userId, req.user!.id));

        return { order, totalAmount };
      });

      if (paymentMethod === 'online') {
        try {
          const paymentResult = await paymentService.createPayment({
            orderId: result.order.id,
            amount: result.totalAmount,
            description: `Order #${result.order.id}`,
          });

          if (paymentResult.success) {
            await db
              .update(orders)
              .set({
                status: 'paid',
                deliveryChargePaid: true,
                updatedAt: new Date(),
              })
              .where(eq(orders.id, result.order.id));

            result.order.status = 'paid';
            result.order.deliveryChargePaid = true;
          }
        } catch (paymentError) {
          console.error('Payment service error:', paymentError);
        }
      } else {
        await db
          .update(orders)
          .set({
            deliveryChargePaid: true,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, result.order.id));
      }

      res.status(201).json({
        success: true,
        data: result.order,
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

      const ordersList = await db
        .select()
        .from(orders)
        .where(and(eq(orders.buyerId, req.user!.id), isNull(orders.deletedAt)))
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: ordersList,
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

      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, parseInt(id)), isNull(orders.deletedAt)))
        .limit(1);

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      res.json({
        success: true,
        data: { ...order, items },
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
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(orders.id, parseInt(id)), isNull(orders.deletedAt)))
        .returning();

      if (!updated) {
        throw new NotFoundError('Order not found');
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
