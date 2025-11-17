import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function POST() {
  try {
    const pool = getPool();
    
    // Get fresh data from database
    const requestsResult = await pool.query(`
      SELECT 
        pr.id,
        pr.publisher_name,
        pr.email,
        pr.company_name,
        pr.telegram_id,
        pr.offer_id,
        pr.creative_type,
        pr.priority,
        pr.status,
        pr.submitted_data,
        pr.created_at,
        pr.updated_at
      FROM publisher_requests pr
      ORDER BY pr.created_at DESC
    `);
    
    const advertiserResponsesResult = await pool.query(`
      SELECT 
        pr.id,
        pr.publisher_name,
        pr.email,
        pr.company_name,
        pr.telegram_id,
        pr.offer_id,
        pr.creative_type,
        pr.priority,
        pr.status,
        pr.submitted_data,
        pr.created_at,
        pr.updated_at
      FROM publisher_requests pr
      WHERE pr.status IN ('admin_approved', 'admin_rejected', 'approved', 'rejected')
      ORDER BY pr.updated_at DESC
    `);
    
    // Get metrics
    const totalAssets = await pool.query('SELECT COUNT(*) as count FROM publisher_requests');
    const newRequests = await pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'pending'");
    const approvedAssets = await pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'admin_approved'");
    const rejectedAssets = await pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'admin_rejected'");
    const pendingAssets = await pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'pending'");
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard data refreshed successfully',
      data: {
        requests: requestsResult.rows,
        advertiser_responses: advertiserResponsesResult.rows,
        metrics: {
          total_assets: parseInt(totalAssets.rows[0]?.count || '0', 10),
          new_requests: parseInt(newRequests.rows[0]?.count || '0', 10),
          approved_assets: parseInt(approvedAssets.rows[0]?.count || '0', 10),
          rejected_assets: parseInt(rejectedAssets.rows[0]?.count || '0', 10),
          pending_assets: parseInt(pendingAssets.rows[0]?.count || '0', 10)
        }
      }
    });
    
  } catch (error: unknown) {
    console.error('Refresh dashboard error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to refresh dashboard data'
      },
      { status: 500 }
    );
  }
}
