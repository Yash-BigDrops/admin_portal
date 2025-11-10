import { NextResponse } from 'next/server'
import { getAdminSession } from '@repo/auth'
import { getPool } from '@repo/database'

async function getAuth() {
  try {
    const { auth } = await import('@/lib/auth')
    return auth()
  } catch {
    return null
  }
}

export async function GET() {
  const session = await getAdminSession(getAuth)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pool = getPool()
  const result = await pool.query(
    'SELECT * FROM publisher_requests ORDER BY created_at DESC'
  )
  
  return NextResponse.json(result.rows)
}

