import { NextResponse } from 'next/server';
import { initializeDatabase, getPool } from '@/lib/database/db';

export async function GET() {
  try {
    // Test database connection and initialize tables
    await initializeDatabase();
    
    const pool = getPool();
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    
    return NextResponse.json({
      success: true,
      message: 'Admin Portal database connected successfully',
      timestamp: result.rows[0].current_time,
      postgresVersion: result.rows[0].pg_version,
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Connected' : 'Not configured'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    }, { status: 500 });
  }
}
