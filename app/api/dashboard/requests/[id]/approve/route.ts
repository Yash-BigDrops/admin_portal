import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { adminNotes, action } = await request.json();
    const { id } = params;
    const pool = getPool();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const status = action === 'approve' ? 'admin_approved' : 'admin_rejected';

    const result = await pool.query(`
      UPDATE publisher_requests 
      SET status = $1, admin_notes = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [status, adminNotes, id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: result.rows[0] });

  } catch (error) {
    console.error('Approval API error:', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}