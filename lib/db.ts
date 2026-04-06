import { neon } from '@neondatabase/serverless'

let sql: ReturnType<typeof neon> | null = null

export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
  if (!sql) sql = neon(process.env.DATABASE_URL)
  return sql
}

export async function initDb() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, lesson_id)
    )
  `
}
