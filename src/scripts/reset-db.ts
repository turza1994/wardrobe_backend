import dotenv from 'dotenv'
import { db } from '../db'
import { sql } from 'drizzle-orm'

dotenv.config()

async function resetDatabase() {
  try {
    console.log('🗑️ Resetting database for clean slate...')

    // Drop all tables in reverse dependency order
    const tables = [
      'otp_verifications',
      'warehouse_inventory',
      'notifications',
      'withdrawal_requests',
      'transactions',
      'rentals',
      'deliveries',
      'negotiations',
      'order_items',
      'orders',
      'cart_items',
      'items',
      'categories',
      'users',
      'admin_configs',
    ]

    for (const table of tables) {
      try {
        await db.execute(
          sql`DROP TABLE IF EXISTS ${sql.identifier(table)} CASCADE`
        )
        console.log(`✓ Dropped table: ${table}`)
      } catch (error) {
        console.log(`- Could not drop table: ${table} (might not exist)`)
      }
    }

    // Drop custom types
    try {
      await db.execute(sql`DROP TYPE IF EXISTS role CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS user_status CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS item_availability CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS item_status CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS order_type CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS order_status CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS order_item_status CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS payment_method CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS negotiation_status CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS delivery_status CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS verification_status CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS transaction_type CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS transaction_status CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS notification_type CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS rental_return_status CASCADE`)
      await db.execute(sql`DROP TYPE IF EXISTS withdrawal_status CASCADE`)
      console.log('✓ Dropped custom types')
    } catch (error) {
      console.log('- Could not drop some types (might not exist)')
    }

    console.log('✅ Database reset completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    process.exit(1)
  }
}

resetDatabase()
