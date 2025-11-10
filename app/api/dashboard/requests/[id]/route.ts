import { NextRequest, NextResponse } from 'next/server'

import { getPool } from '@/lib/database/db'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { requirePermission } from '@/lib/auth/require-auth'
import { notFound, serverError, unauthorized, ok } from '@/lib/http/responses'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  const { session, error } = await requirePermission('MANAGE_OFFERS')
  if (error || !session) {
    return unauthorized(error?.message || 'Unauthorized')
  }
  try {
    const { id } = await params

    const pool = getPool()

    const result = await pool.query(
      `
      SELECT 
        id,
        publisher_name,
        email,
        company_name,
        telegram_id,
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
      `,
      [id]
    )

    if (result.rowCount === 0) {
      return notFound('Request not found')
    }

    const row = result.rows[0]

    return ok({
      request: {
        id: row.id,
        publisherName: row.publisher_name,
        email: row.email,
        companyName: row.company_name,
        telegramId: row.telegram_id,
        offerId: row.offer_id,
        creativeType: row.creative_type,
        priority: row.priority,
        status: row.status,
        submittedData: row.submitted_data,
        adminNotes: row.admin_notes,
        clientNotes: row.client_notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    })
  } catch (error) {
    console.error('Get request API error:', error)
    return serverError('Failed to fetch request')
  }
}
