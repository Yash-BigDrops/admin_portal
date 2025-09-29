import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function GET() {
  try {
    const pool = getPool();

    // Get basic counts
    const [totalAssets, newRequests, approvedAssets, rejectedAssets, pendingAssets] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM publisher_requests'),
      pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE created_at::date = CURRENT_DATE"),
      pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'admin_approved' OR status = 'approved'"),
      pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'admin_rejected' OR status = 'rejected'"),
      pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'pending'")
    ]);

    // Get daily and monthly counts with proper timezone handling
    const timeBasedCounts = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS count_today,
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day') AS count_yesterday,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) AS count_current_month,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')) AS count_last_month
      FROM publisher_requests;
    `);

    const timeData = timeBasedCounts.rows[0];

    const metrics = {
      totalAssets: parseInt(totalAssets.rows[0].count),
      newRequests: parseInt(newRequests.rows[0].count),
      approvedAssets: parseInt(approvedAssets.rows[0].count),
      rejectedAssets: parseInt(rejectedAssets.rows[0].count),
      pendingAssets: parseInt(pendingAssets.rows[0].count),
      // Time-based metrics
      today: parseInt(timeData.count_today),
      yesterday: parseInt(timeData.count_yesterday),
      currentMonth: parseInt(timeData.count_current_month),
      lastMonth: parseInt(timeData.count_last_month)
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
