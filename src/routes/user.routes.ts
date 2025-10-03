import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  updateUserStatusSchema,
  updateUserRoleSchema,
  verifyUserSchema,
  uploadNIDSchema,
  getUserSchema,
} from '../validations/user.validation';

const router = Router();
const userController = new UserController();

router.use(authenticate);

router.get('/', authorize('admin'), userController.list);
router.get('/:id', validate(getUserSchema), userController.getById);

router.post('/nid', validate(uploadNIDSchema), userController.uploadNID);

router.put(
  '/:id/status',
  authorize('admin'),
  validate(getUserSchema),
  validate(updateUserStatusSchema),
  userController.updateStatus
);

router.put(
  '/:id/role',
  authorize('admin'),
  validate(getUserSchema),
  validate(updateUserRoleSchema),
  userController.updateRole
);

router.put(
  '/:id/verify',
  authorize('admin'),
  validate(getUserSchema),
  validate(verifyUserSchema),
  userController.verifyUser
);

export default router;
