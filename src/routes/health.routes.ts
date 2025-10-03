import { Router, Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    await db.execute(sql`SELECT 1`);
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed',
    });
  }
});

router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({
      success: true,
      status: 'ready',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'not ready',
    });
  }
});

router.get('/health/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'alive',
  });
});

export default router;
