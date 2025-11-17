import { NextResponse } from 'next/server'
import { getPool } from '@repo/database'

export async function GET() {
  try {
    const pool = getPool()
    
    // Test connection
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version')
    
    // Check if admin user exists
    const userResult = await pool.query(
      'SELECT email, role, is_active FROM users WHERE email = $1',
      ['admin@bigdrops.com']
    )
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        currentTime: result.rows[0].current_time,
        pgVersion: result.rows[0].pg_version.substring(0, 50) + '...',
      },
      user: {
        exists: userResult.rows.length > 0,
        email: userResult.rows[0]?.email || null,
        role: userResult.rows[0]?.role || null,
        isActive: userResult.rows[0]?.is_active || null,
      },
      env: {
        databaseUrlSet: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL 
          ? process.env.DATABASE_URL.substring(0, 30) + '...' 
          : 'NOT SET',
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        databaseUrlSet: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL 
          ? process.env.DATABASE_URL.substring(0, 30) + '...' 
          : 'NOT SET',
      }
    }, { status: 500 })
  }
}

