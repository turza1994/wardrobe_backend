import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();

router.use(authenticate, authorize('admin'));

router.get('/configs', adminController.getAllConfigs);
router.get('/configs/:key', adminController.getConfig);
router.put('/configs/:key', adminController.updateConfig);

router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/ledger', adminController.getTransactionLedger);
router.get('/reports/inventory', adminController.getInventoryTurnover);

export default router;
