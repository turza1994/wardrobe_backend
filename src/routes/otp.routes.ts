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

router.post(
  '/send-otp',
  validate(sendOTPSchema),
  otpController.sendOTP.bind(otpController)
)
router.post(
  '/verify-otp',
  validate(verifyOTPSchema),
  otpController.verifyOTP.bind(otpController)
)
router.post(
  '/resend-otp',
  validate(resendOTPSchema),
  otpController.resendOTP.bind(otpController)
)

export default router
