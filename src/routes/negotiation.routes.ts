import { Router } from 'express';
import { NegotiationController } from '../controllers/negotiation.controller';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import {
  createNegotiationSchema,
  respondToNegotiationSchema,
} from '../validations/negotiation.validation';

const router = Router();
const negotiationController = new NegotiationController();

router.use(authenticate);

router.get('/', negotiationController.list);
router.get('/:id', negotiationController.getById);
router.post('/', validate(createNegotiationSchema), negotiationController.create);
router.put('/:id/respond', validate(respondToNegotiationSchema), negotiationController.respond);

export default router;
