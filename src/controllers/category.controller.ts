import { Response, NextFunction } from 'express';
import { db } from '../db';
import { categories } from '../db/schema';
import { eq, and, isNull, ilike } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { NotFoundError, ConflictError } from '../utils/error';

export class CategoryController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, slug, description } = req.body;

      const [existing] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.name, name), isNull(categories.deletedAt)))
        .limit(1);

      if (existing) {
        throw new ConflictError('Category with this name already exists');
      }

      const [category] = await db
        .insert(categories)
        .values({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          description,
        })
        .returning();

      res.status(201).json({
        success: true,
        data: category,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      let conditions = [isNull(categories.deletedAt)];

      if (search) {
        conditions.push(ilike(categories.name, `%${search}%`));
      }

      const items = await db
        .select()
        .from(categories)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total: items.length,
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

      const [category] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, parseInt(id)), isNull(categories.deletedAt)))
        .limit(1);

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      res.json({
        success: true,
        data: category,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, slug, description } = req.body;

      const [updated] = await db
        .update(categories)
        .set({
          ...(name && { name }),
          ...(slug && { slug }),
          ...(description !== undefined && { description }),
          updatedAt: new Date(),
        })
        .where(and(eq(categories.id, parseInt(id)), isNull(categories.deletedAt)))
        .returning();

      if (!updated) {
        throw new NotFoundError('Category not found');
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

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const [deleted] = await db
        .update(categories)
        .set({ deletedAt: new Date() })
        .where(and(eq(categories.id, parseInt(id)), isNull(categories.deletedAt)))
        .returning();

      if (!deleted) {
        throw new NotFoundError('Category not found');
      }

      res.json({
        success: true,
        message: 'Category deleted successfully',
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}
