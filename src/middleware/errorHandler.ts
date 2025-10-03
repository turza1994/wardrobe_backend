import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error';
import { AuthRequest } from '../types';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.error(`[${req.requestId}] Error:`, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      requestId: req.requestId,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: req.requestId,
    ...(env.NODE_ENV === 'development' && { details: err.message, stack: err.stack }),
  });
};

export const notFoundHandler = (req: AuthRequest, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requestId: req.requestId,
  });
};
