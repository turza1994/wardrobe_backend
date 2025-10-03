import { Response, NextFunction } from 'express';
import { AuthRequest, AuthUser } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/error';
import { authService } from '../services/auth';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, isNull } from 'drizzle-orm';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user || user.status === 'deleted') {
      throw new UnauthorizedError('User not found or deleted');
    }

    if (user.status === 'suspended') {
      throw new ForbiddenError('Your account has been suspended');
    }

    if (user.status !== 'active') {
      throw new ForbiddenError('Your account is not active');
    }

    req.user = user as AuthUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};
