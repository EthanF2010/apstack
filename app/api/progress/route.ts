import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  try {
    await initDb()
    const sql = getDb()
    const rows = await sql`
      SELECT lesson_id, completed FROM progress WHERE user_id = ${userId}
    ` as { lesson_id: string; completed: boolean }[]
    const completed: Record<string, boolean> = {}
    for (const row of rows) completed[row.lesson_id] = row.completed
    return NextResponse.json({ completed })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { userId, lessonId, completed } = await req.json()
  if (!userId || !lessonId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  try {
    await initDb()
    const sql = getDb()
    await sql`
      INSERT INTO progress (user_id, lesson_id, completed, updated_at)
      VALUES (${userId}, ${lessonId}, ${completed}, NOW())
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET completed = ${completed}, updated_at = NOW()
    `
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
