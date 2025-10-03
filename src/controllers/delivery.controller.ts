import { Response, NextFunction } from 'express';
import { db } from '../db';
import { deliveries, orders } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/error';
import { deliveryService } from '../services/delivery';

export class DeliveryController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { orderId, fromAddress, toAddress, isReturn } = req.body;

      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), isNull(orders.deletedAt)))
        .limit(1);

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (req.user!.role !== 'admin' && order.buyerId !== req.user!.id) {
        throw new ForbiddenError('You can only create deliveries for your own orders');
      }

      let trackingId: string | null = null;

      try {
        const deliveryResult = await deliveryService.requestDelivery({
          orderId,
          fromAddress,
          toAddress,
          contactPhone: '0000000000',
          isReturn,
        });
        trackingId = deliveryResult.trackingId || null;
      } catch (deliveryError) {
        console.error('Delivery service error:', deliveryError);
      }

      const [delivery] = await db
        .insert(deliveries)
        .values({
          orderId,
          fromAddress,
          toAddress,
          trackingId,
          isReturn,
          status: 'pending',
        })
        .returning();

      res.status(201).json({
        success: true,
        data: delivery,
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
      const orderId = req.query.orderId ? parseInt(req.query.orderId as string) : null;

      let conditions = [isNull(deliveries.deletedAt)];

      if (orderId) {
        conditions.push(eq(deliveries.orderId, orderId));
      }

      const deliveriesList = await db
        .select()
        .from(deliveries)
        .innerJoin(orders, eq(deliveries.orderId, orders.id))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      if (req.user!.role !== 'admin') {
        const filteredDeliveries = deliveriesList.filter(
          (d) => d.orders.buyerId === req.user!.id
        );
        return res.json({
          success: true,
          data: filteredDeliveries,
          pagination: { page, limit },
          requestId: req.requestId,
        });
      }

      res.json({
        success: true,
        data: deliveriesList,
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

      const [delivery] = await db
        .select()
        .from(deliveries)
        .innerJoin(orders, eq(deliveries.orderId, orders.id))
        .where(and(eq(deliveries.id, parseInt(id)), isNull(deliveries.deletedAt)))
        .limit(1);

      if (!delivery) {
        throw new NotFoundError('Delivery not found');
      }

      if (req.user!.role !== 'admin' && delivery.orders.buyerId !== req.user!.id) {
        throw new ForbiddenError('You can only view your own deliveries');
      }

      res.json({
        success: true,
        data: delivery,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, trackingId } = req.body;

      const updateData: any = { status, updatedAt: new Date() };
      if (trackingId) {
        updateData.trackingId = trackingId;
      }

      const [updated] = await db
        .update(deliveries)
        .set(updateData)
        .where(and(eq(deliveries.id, parseInt(id)), isNull(deliveries.deletedAt)))
        .returning();

      if (!updated) {
        throw new NotFoundError('Delivery not found');
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
