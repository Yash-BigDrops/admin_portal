import { NextResponse } from 'next/server'
import { getPool } from '@repo/database'

export async function GET() {
  try {
    const pool = getPool()

    // Simple connectivity check
    const ping = await pool.query('SELECT NOW() as now')

    // Check if offers table exists and count rows
    let offersCount = null
    try {
      const countRes = await pool.query('SELECT COUNT(*)::int AS count FROM offers')
      offersCount = countRes.rows[0].count
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Error querying offers table',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      now: ping.rows[0].now,
      offersCount,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

