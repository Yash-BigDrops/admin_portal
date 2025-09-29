import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function GET() {
  try {
    const pool = getPool();
    
    // Test basic connection
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as users_table_exists;
    `);
    
    // If users table exists, get user count
    let userCount = 0;
    if (tableCheck.rows[0].users_table_exists) {
      const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
      userCount = parseInt(userResult.rows[0].count);
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      database: {
        connected: true,
        current_time: connectionTest.rows[0].current_time,
        users_table_exists: tableCheck.rows[0].users_table_exists,
        user_count: userCount
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Database connection failed'
      },
      { status: 500 }
    );
  }
}
