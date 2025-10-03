import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const transactionController = new TransactionController();

router.use(authenticate);

router.get('/', transactionController.list);
router.post('/withdraw', transactionController.requestWithdrawal);
router.get('/withdrawals', transactionController.getWithdrawals);

router.get('/admin/withdrawals', authorize('admin'), transactionController.getAllWithdrawals);
router.put('/admin/withdrawals/:id', authorize('admin'), transactionController.processWithdrawal);

export default router;
