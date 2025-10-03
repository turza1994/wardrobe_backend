import { Response, NextFunction } from 'express';
import { db } from '../db';
import {
  rentals,
  orderItems,
  orders,
  items,
  transactions,
  users,
  adminConfigs,
  deliveries,
} from '../db/schema';
import { eq, and, isNull, gte } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/error';
import { deliveryService } from '../services/delivery';
import { notificationService } from '../services/notification';

export class RentalController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const rentalsList = await db
        .select({
          id: rentals.id,
          orderItemId: rentals.orderItemId,
          rentalStart: rentals.rentalStart,
          rentalEnd: rentals.rentalEnd,
          returnStatus: rentals.returnStatus,
          lateFee: rentals.lateFee,
          createdAt: rentals.createdAt,
        })
        .from(rentals)
        .innerJoin(orderItems, eq(rentals.orderItemId, orderItems.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.buyerId, req.user!.id),
            isNull(rentals.deletedAt)
          )
        )
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: rentalsList,
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

      const [rental] = await db
        .select()
        .from(rentals)
        .where(and(eq(rentals.id, parseInt(id)), isNull(rentals.deletedAt)))
        .limit(1);

      if (!rental) {
        throw new NotFoundError('Rental not found');
      }

      const [orderItem] = await db
        .select()
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(eq(orderItems.id, rental.orderItemId))
        .limit(1);

      if (req.user!.role !== 'admin' && orderItem.orders.buyerId !== req.user!.id) {
        throw new ForbiddenError('You can only view your own rentals');
      }

      res.json({
        success: true,
        data: { ...rental, orderItem },
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async initiateReturn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const [rental] = await db
        .select()
        .from(rentals)
        .innerJoin(orderItems, eq(rentals.orderItemId, orderItems.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(eq(rentals.id, parseInt(id)), isNull(rentals.deletedAt)))
        .limit(1);

      if (!rental) {
        throw new NotFoundError('Rental not found');
      }

      if (rental.orders.buyerId !== req.user!.id) {
        throw new ForbiddenError('You can only return your own rentals');
      }

      if (rental.rentals.returnStatus !== 'pending') {
        throw new ValidationError('Rental return already initiated');
      }

      const now = new Date();
      let lateFee = 0;

      if (now > rental.rentals.rentalEnd) {
        const daysLate = Math.ceil(
          (now.getTime() - rental.rentals.rentalEnd.getTime()) / (1000 * 60 * 60 * 24)
        );
        const rentalPrice = parseFloat(rental.order_items.price);
        lateFee = daysLate * rentalPrice * 0.1;
      }

      const [updated] = await db
        .update(rentals)
        .set({
          returnStatus: 'pending',
          lateFee: lateFee.toString(),
          updatedAt: new Date(),
        })
        .where(eq(rentals.id, parseInt(id)))
        .returning();

      try {
        await deliveryService.requestDelivery({
          orderId: rental.orders.id,
          fromAddress: rental.orders.buyerId.toString(),
          toAddress: 'warehouse',
          contactPhone: '0000000000',
          isReturn: true,
        });
      } catch (deliveryError) {
        console.error('Delivery service error:', deliveryError);
      }

      await notificationService.sendNotification({
        userId: rental.orders.buyerId,
        type: 'system',
        message: `Return initiated for rental #${rental.rentals.id}. ${lateFee > 0 ? `Late fee: ${lateFee.toFixed(2)} TK` : ''}`,
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

  async inspectReturn(req: AuthRequest, res: Response, next: NextFunction) {
    const dbClient = db as any;

    try {
      const { id } = req.params;
      const { inspectionResult, refundAmount, lateFee } = req.body;

      const result = await dbClient.transaction(async (tx: any) => {
        const [rental] = await tx
          .select()
          .from(rentals)
          .innerJoin(orderItems, eq(rentals.orderItemId, orderItems.id))
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(and(eq(rentals.id, parseInt(id)), isNull(rentals.deletedAt)))
          .limit(1);

        if (!rental) {
          throw new NotFoundError('Rental not found');
        }

        if (rental.rentals.returnStatus !== 'pending') {
          throw new ValidationError('Rental is not pending inspection');
        }

        const [updated] = await tx
          .update(rentals)
          .set({
            returnStatus: 'inspected',
            inspectionResult,
            refundAmount: refundAmount.toString(),
            lateFee: lateFee.toString(),
            updatedAt: new Date(),
          })
          .where(eq(rentals.id, parseInt(id)))
          .returning();

        const totalRefund = refundAmount - lateFee;

        if (totalRefund > 0) {
          await tx.insert(transactions).values({
            userId: rental.orders.buyerId,
            orderId: rental.orders.id,
            amount: totalRefund.toString(),
            type: 'refund',
            status: 'completed',
            description: `Refund for rental #${rental.rentals.id} after inspection`,
          });

          const [currentUser] = await tx
            .select()
            .from(users)
            .where(eq(users.id, rental.orders.buyerId))
            .limit(1);
          
          const newBalance = parseFloat(currentUser.balance) + totalRefund;
          
          await tx
            .update(users)
            .set({
              balance: newBalance.toString(),
            })
            .where(eq(users.id, rental.orders.buyerId));
        }

        if (lateFee > 0) {
          await tx.insert(transactions).values({
            userId: rental.orders.buyerId,
            orderId: rental.orders.id,
            amount: lateFee.toString(),
            type: 'fee',
            status: 'completed',
            description: `Late fee for rental #${rental.rentals.id}`,
          });
        }

        await notificationService.sendNotification({
          userId: rental.orders.buyerId,
          type: 'system',
          message: `Rental inspection completed. ${totalRefund > 0 ? `Refund: ${totalRefund.toFixed(2)} TK` : 'No refund issued'}.`,
        });

        return updated;
      });

      res.json({
        success: true,
        data: result,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}
