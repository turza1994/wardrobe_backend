import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { validate } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategorySchema,
} from '../validations/category.validation';

const router = Router();
const categoryController = new CategoryController();

router.get('/', categoryController.list);
router.get('/:id', validate(getCategorySchema), categoryController.getById);

router.use(authenticate, authorize('admin'));

router.post('/', validate(createCategorySchema), categoryController.create);
router.put('/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/:id', validate(getCategorySchema), categoryController.delete);

export default router;
