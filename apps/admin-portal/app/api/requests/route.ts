import { NextResponse } from 'next/server'
import { getAdminSession } from '@repo/auth'
import { getPool } from '@repo/database'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession(() => auth())
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pool = getPool()
  const result = await pool.query(
    'SELECT * FROM requests ORDER BY created_at DESC'
  )
  
  return NextResponse.json(result.rows)
}

