import { NextRequest, NextResponse } from 'next/server'

import { getPool } from '@/lib/database/db'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { requirePermission } from '@/lib/auth/require-auth'
import { auditLog } from '@/lib/logging/audit-log'
import { notFound, serverError, badRequest, unauthorized, ok } from '@/lib/http/responses'
import { z } from 'zod'

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  adminNotes: z.string().optional(),
})

export async function POST(
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

    const body = await request.json()

    const { action, adminNotes } = approvalSchema.parse(body)

    const status = action === 'approve' ? 'admin_approved' : 'admin_rejected'

    const pool = getPool()

    const result = await pool.query(
      `
      UPDATE publisher_requests 
      SET status = $1, admin_notes = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING 
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
      `,
      [status, adminNotes ?? null, id]
    )

    if (result.rowCount === 0) {
      return notFound('Request not found')
    }

    const row = result.rows[0]

    auditLog({
      actorId: session.user.id,
      actorEmail: session.user.email || undefined,
      action: action === 'approve' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
      entity: 'publisher_request',
      entityId: row.id,
      metadata: {
        status: row.status,
        offerId: row.offer_id,
        priority: row.priority,
      },
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] ??
          request.headers.get('x-real-ip') ??
          undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

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
  } catch (error: unknown) {
    console.error('Approval API error:', error)
    if (error instanceof z.ZodError) {
      return badRequest('Validation error', { details: error.errors })
    }

    return serverError('Failed to process approval')
  }
}
