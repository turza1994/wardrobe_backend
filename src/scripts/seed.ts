import dotenv from 'dotenv'
import { db } from '../db'
import { adminConfigs, users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authService } from '../services/auth'
import { env } from '../config/env'

dotenv.config()

async function seed() {
  try {
    console.log('🌱 Seeding database...')

    const defaultConfigs = [
      {
        key: 'delivery_charge_per_order',
        value: '100.00',
        description: 'Delivery charge per order (in TK)',
      },
      {
        key: 'safety_deposit_percentage',
        value: '30',
        description: 'Safety deposit percentage for rentals',
      },
      {
        key: 'rental_period_days',
        value: '7',
        description: 'Default rental period in days',
      },
      {
        key: 'platform_fee_sale_percent',
        value: '8',
        description: 'Platform fee percentage for sales',
      },
      {
        key: 'platform_fee_rental_percent',
        value: '16',
        description: 'Platform fee percentage for rentals',
      },
      {
        key: 'negotiation_hold_minutes',
        value: '1440',
        description: 'Hold time for negotiated prices in cart (in minutes)',
      },
      {
        key: 'payment_timeout_minutes',
        value: '1440',
        description: 'Payment timeout for orders (in minutes)',
      },
    ]

    for (const config of defaultConfigs) {
      const [existing] = await db
        .select()
        .from(adminConfigs)
        .where(eq(adminConfigs.key, config.key))
        .limit(1)

      if (!existing) {
        await db.insert(adminConfigs).values(config)
        console.log(`✓ Created config: ${config.key}`)
      } else {
        console.log(`- Config already exists: ${config.key}`)
      }
    }

    // Check for existing admin by phone (new system)
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.phone, '01711111111')) // Default admin phone
      .limit(1)

    if (!existingAdmin) {
      const passwordHash = await authService.hashPassword(env.ADMIN_PASSWORD)

      await db.insert(users).values({
        name: 'Admin',
        phone: '01711111111', // Default admin phone number
        email: env.ADMIN_EMAIL,
        passwordHash,
        role: 'admin',
        status: 'active',
        phoneVerified: true, // Admin is pre-verified
        phoneVerifiedAt: new Date(),
      })

      console.log(
        `✓ Created admin user: ${env.ADMIN_EMAIL} (Phone: 01711111111)`
      )
    } else {
      console.log(`- Admin user already exists: ${existingAdmin.phone}`)
    }

    console.log('✅ Seeding completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()
