import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql } from 'drizzle-orm'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL!

async function cleanDatabase() {
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  try {
    console.log('🧹 Cleaning database...')

    // Get all table names
    const result = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `

    const tables = result.map((row) => row.table_name)

    if (tables.length === 0) {
      console.log('✅ No tables found. Database is already clean.')
      return
    }

    console.log(`📋 Found ${tables.length} tables:`, tables.join(', '))

    // Drop all tables in reverse order of dependencies
    const dropOrder = [
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
      'users',
      'categories',
      'admin_configs',
    ]

    for (const table of dropOrder) {
      if (tables.includes(table)) {
        try {
          await client`DROP TABLE IF EXISTS ${client(table)} CASCADE`
          console.log(`🗑️  Dropped table: ${table}`)
        } catch (error) {
          console.error(`❌ Failed to drop table ${table}:`, error)
        }
      }
    }

    // Drop all custom types
    const typesResult = await client`
      SELECT typname
      FROM pg_type
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
    `

    const types = typesResult.map((row) => row.typname)

    for (const type of types) {
      try {
        await client`DROP TYPE IF EXISTS ${client(type)} CASCADE`
        console.log(`🗑️  Dropped type: ${type}`)
      } catch (error) {
        console.error(`❌ Failed to drop type ${type}:`, error)
      }
    }

    console.log('✅ Database cleaned successfully!')
  } catch (error) {
    console.error('❌ Error cleaning database:', error)
  } finally {
    await client.end()
  }
}

cleanDatabase()
