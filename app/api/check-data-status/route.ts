import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function GET() {
  try {
    const pool = getPool();
    
    // Get counts from admin database
    const adminRequests = await pool.query('SELECT COUNT(*) as count FROM publisher_requests');
    const adminUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    
    // Get sample data from admin database
    const sampleRequests = await pool.query(`
      SELECT 
        id,
        publisher_name,
        company_name,
        offer_id,
        status,
        created_at
      FROM publisher_requests 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    return NextResponse.json({
      success: true,
      admin_database: {
        publisher_requests_count: parseInt(adminRequests.rows[0].count),
        users_count: parseInt(adminUsers.rows[0].count),
        sample_requests: sampleRequests.rows
      },
      message: 'Data status checked successfully'
    });
    
  } catch (error) {
    console.error('Check data status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check data status'
      },
      { status: 500 }
    );
  }
}
