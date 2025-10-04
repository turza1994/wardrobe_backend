import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL!

console.log(
  '🔗 Database connecting to:',
  connectionString ? 'Neon DB' : 'No DATABASE_URL found'
)

const client = postgres(connectionString, {
  prepare: false,
  max: 1,
  ssl: 'require',
})

export const db = drizzle(client, { schema })
