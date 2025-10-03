import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  getWarehouseItemSchema,
  addToWarehouseSchema,
  updateWarehouseItemSchema,
} from '../validations/warehouse.validation';

const router = Router();
const warehouseController = new WarehouseController();

router.use(authenticate, authorize('admin'));

router.get('/', warehouseController.list);
router.get('/:id', validate(getWarehouseItemSchema), warehouseController.getById);
router.post('/', validate(addToWarehouseSchema), warehouseController.addItem);
router.put('/:id', validate(updateWarehouseItemSchema), warehouseController.updateItem);
router.delete('/:id', validate(getWarehouseItemSchema), warehouseController.deleteItem);

export default router;
