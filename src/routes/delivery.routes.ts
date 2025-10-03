import { Router } from 'express';
import { DeliveryController } from '../controllers/delivery.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  getDeliverySchema,
  createDeliverySchema,
  updateDeliveryStatusSchema,
} from '../validations/delivery.validation';

const router = Router();
const deliveryController = new DeliveryController();

router.use(authenticate);

router.get('/', deliveryController.list);
router.get('/:id', validate(getDeliverySchema), deliveryController.getById);
router.post('/', validate(createDeliverySchema), deliveryController.create);
router.put(
  '/:id/status',
  authorize('admin'),
  validate(updateDeliveryStatusSchema),
  deliveryController.updateStatus
);

export default router;
