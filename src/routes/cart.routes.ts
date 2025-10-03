import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeFromCartSchema,
} from '../validations/cart.validation';

const router = Router();
const cartController = new CartController();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', validate(addToCartSchema), cartController.addItem);
router.put('/:id', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/:id', validate(removeFromCartSchema), cartController.removeItem);
router.delete('/', cartController.clearCart);

export default router;
