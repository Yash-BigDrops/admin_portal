import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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
        admin_notes,
        client_notes,
        created_at,
        updated_at
      FROM publisher_requests
      WHERE id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = result.rows[0];
    return NextResponse.json({
      success: true,
      request: {
        id: requestData.id,
        publisherName: requestData.publisher_name,
        email: requestData.email,
        companyName: requestData.company_name,
        offerId: requestData.offer_id,
        creativeType: requestData.creative_type,
        priority: requestData.priority,
        status: requestData.status,
        submittedData: requestData.submitted_data,
        adminNotes: requestData.admin_notes,
        clientNotes: requestData.client_notes,
        createdAt: requestData.created_at,
        updatedAt: requestData.updated_at
      }
    });

  } catch (error) {
    console.error('Get request API error:', error);
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
  }
}
