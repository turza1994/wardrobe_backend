import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { validate } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { createOrderSchema, updateOrderStatusSchema } from '../validations/order.validation';

const router = Router();
const orderController = new OrderController();

router.use(authenticate);

router.get('/', orderController.list);
router.get('/:id', orderController.getById);
router.post('/', validate(createOrderSchema), orderController.create);
router.put('/:id/status', authorize('admin'), validate(updateOrderStatusSchema), orderController.updateStatus);

export default router;
