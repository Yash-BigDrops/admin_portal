import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@repo/database'
import { getAdminSession } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)))
  const offset = (page - 1) * pageSize

  try {
    const pool = getPool()
    const { rows } = await pool.query(
      `SELECT actor_email, action, entity, entity_id, metadata, created_at,
              COUNT(*) OVER() AS __total
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )

    const total = rows[0]?.__total ?? 0
    rows.forEach((r: any) => delete r.__total)

    return NextResponse.json({ data: rows, page, pageSize, total })
  } catch (error: any) {
    console.error('Audit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to load audit logs', details: error.message },
      { status: 500 }
    )
  }
}

