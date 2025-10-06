import { Router } from 'express'
import healthRoutes from './health.routes'
import authRoutes from './auth.routes'
import otpRoutes from './otp.routes'
import adminRoutes from './admin.routes'
import userRoutes from './user.routes'
import categoryRoutes from './category.routes'
import itemRoutes from './item.routes'
import cartRoutes from './cart.routes'
import orderRoutes from './order.routes'
import negotiationRoutes from './negotiation.routes'
import notificationRoutes from './notification.routes'
import transactionRoutes from './transaction.routes'
import rentalRoutes from './rental.routes'
import deliveryRoutes from './delivery.routes'
import warehouseRoutes from './warehouse.routes'

const router = Router()

router.use('/', healthRoutes)
router.use('/auth', authRoutes)
router.use('/auth', otpRoutes) // OTP routes under /auth/*
router.use('/admin', adminRoutes)
router.use('/users', userRoutes)
router.use('/categories', categoryRoutes)
router.use('/items', itemRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/negotiations', negotiationRoutes)
router.use('/notifications', notificationRoutes)
router.use('/transactions', transactionRoutes)
router.use('/rentals', rentalRoutes)
router.use('/deliveries', deliveryRoutes)
router.use('/warehouse', warehouseRoutes)

export default router
