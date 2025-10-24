import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function GET() {
  try {
    const pool = getPool();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(todayStart.getTime());
    
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAssets, newRequests, approvedAssets, rejectedAssets, pendingAssets, timeBasedCounts] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM publisher_requests'),
      pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE created_at >= $1 AND created_at < $2", [todayStart.toISOString(), todayEnd.toISOString()]),
      pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'admin_approved' OR status = 'approved'"),
      pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'admin_rejected' OR status = 'rejected'"),
      pool.query("SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'pending'"),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= $1 AND created_at < $2) AS count_today,
          COUNT(*) FILTER (WHERE created_at >= $3 AND created_at < $4) AS count_yesterday,
          COUNT(*) FILTER (WHERE created_at >= $5 AND created_at < $6) AS count_current_month,
          COUNT(*) FILTER (WHERE created_at >= $7 AND created_at < $8) AS count_last_month
        FROM publisher_requests
      `, [
        todayStart.toISOString(), todayEnd.toISOString(),
        yesterdayStart.toISOString(), yesterdayEnd.toISOString(),
        currentMonthStart.toISOString(), currentMonthEnd.toISOString(),
        lastMonthStart.toISOString(), lastMonthEnd.toISOString()
      ])
    ]);

    const timeData = timeBasedCounts.rows[0];

    console.log('Timezone Debug Info:', {
      todayStart: todayStart.toISOString(),
      todayEnd: todayEnd.toISOString(),
      yesterdayStart: yesterdayStart.toISOString(),
      yesterdayEnd: yesterdayEnd.toISOString(),
      currentMonthStart: currentMonthStart.toISOString(),
      currentMonthEnd: currentMonthEnd.toISOString(),
      lastMonthStart: lastMonthStart.toISOString(),
      lastMonthEnd: lastMonthEnd.toISOString()
    });

    const metrics = {
      totalAssets: parseInt(totalAssets.rows[0].count),
      newRequests: parseInt(newRequests.rows[0].count),
      approvedAssets: parseInt(approvedAssets.rows[0].count),
      rejectedAssets: parseInt(rejectedAssets.rows[0].count),
      pendingAssets: parseInt(pendingAssets.rows[0].count),
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
