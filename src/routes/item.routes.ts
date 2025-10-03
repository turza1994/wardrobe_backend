import { Router } from 'express';
import { ItemController } from '../controllers/item.controller';
import { validate } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { createItemSchema, updateItemSchema } from '../validations/item.validation';

const router = Router();
const itemController = new ItemController();

router.get('/', itemController.list);
router.get('/:id', itemController.getById);

router.use(authenticate);

router.post('/', validate(createItemSchema), itemController.create);
router.put('/:id', validate(updateItemSchema), itemController.update);
router.delete('/:id', itemController.delete);

router.put('/:id/status', authorize('admin'), itemController.updateStatus);

export default router;
