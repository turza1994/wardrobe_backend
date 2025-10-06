import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { validate } from '../middleware/validation'
import { authenticate } from '../middleware/auth'
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from '../validations/auth.validation'

const router = Router()
const authController = new AuthController()

router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)
router.get('/profile', authenticate, authController.getProfile)
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile
)

export default router
