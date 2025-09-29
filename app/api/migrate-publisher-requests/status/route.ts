import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function GET() {
  try {
    const pool = getPool();

    // Get count of submissions in Admin Portal
    const adminCount = await pool.query('SELECT COUNT(*) as count FROM publisher_requests');
    
    // Get count by status
    const statusCounts = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM publisher_requests 
      GROUP BY status 
      ORDER BY count DESC
    `);

    // Get recent submissions
    const recentSubmissions = await pool.query(`
      SELECT 
        id, publisher_name, company_name, created_at, status
      FROM publisher_requests 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      stats: {
        totalSubmissions: parseInt(adminCount.rows[0].count),
        statusBreakdown: statusCounts.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count)
        })),
        recentSubmissions: recentSubmissions.rows.map(row => ({
          id: row.id,
          publisher: row.publisher_name,
          company: row.company_name,
          date: row.created_at,
          status: row.status
        }))
      }
    });

  } catch (error) {
    console.error('Migration status error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch migration status'
    }, { status: 500 });
  }
}
