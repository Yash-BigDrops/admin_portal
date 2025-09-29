import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const pool = getPool();

    const result = await pool.query(`
      SELECT 
        id,
        publisher_name,
        email,
        company_name,
        offer_id,
        creative_type,
        priority,
        status,
        submitted_data,
        created_at
      FROM publisher_requests
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const requests = result.rows.map(row => ({
      id: row.id,
      date: new Date(row.created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      company: row.company_name || 'N/A',
      offerId: row.offer_id || 'N/A',
      type: row.creative_type || 'N/A',
      priority: row.priority === 'high' ? 'High Priority' : 
                row.priority === 'medium' ? 'Moderate Priority' : 'Low Priority',
      status: row.status,
      publisherName: row.publisher_name,
      email: row.email,
      submittedData: row.submitted_data
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}