import { Router } from 'express';
import { RentalController } from '../controllers/rental.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  getRentalSchema,
  initiateReturnSchema,
  inspectRentalSchema,
} from '../validations/rental.validation';

const router = Router();
const rentalController = new RentalController();

router.use(authenticate);

router.get('/', rentalController.list);
router.get('/:id', validate(getRentalSchema), rentalController.getById);
router.post('/:id/return', validate(initiateReturnSchema), rentalController.initiateReturn);
router.post(
  '/:id/inspect',
  authorize('admin'),
  validate(inspectRentalSchema),
  rentalController.inspectReturn
);

export default router;
