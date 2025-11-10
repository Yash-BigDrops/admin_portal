import { NextResponse } from 'next/server'
import { getPool } from '@/lib/database/db'

export async function GET() {
  const start = Date.now()

  try {
    const pool = getPool()
    await pool.query('SELECT 1')

    const durationMs = Date.now() - start

    return NextResponse.json({
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      responseTimeMs: durationMs,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Healthcheck error:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
