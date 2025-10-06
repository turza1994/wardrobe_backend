import { Router } from 'express'
import { OTPController } from '../controllers/otp.controller'
import { validate } from '../middleware/validation'
import {
  sendOTPSchema,
  verifyOTPSchema,
  resendOTPSchema,
} from '../validations/otp.validation'

const router = Router()
const otpController = new OTPController()

router.post('/send-otp', validate(sendOTPSchema), otpController.sendOTP)
router.post('/verify-otp', validate(verifyOTPSchema), otpController.verifyOTP)
router.post('/resend-otp', validate(resendOTPSchema), otpController.resendOTP)

export default router
