import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database/db'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { requirePermission } from '@/lib/auth/require-auth'
import { auditLog } from '@/lib/logging/audit-log'
import { unauthorized, serverError, notFound, ok, badRequest } from '@/lib/http/responses'
import { z } from 'zod'

const updatePublisherSchema = z.object({
  publisherName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  companyName: z.string().optional().nullable(),
  telegramId: z.string().optional().nullable(),
  status: z.enum(['active', 'pending', 'suspended', 'admin_approved', 'admin_rejected', 'approved', 'rejected']).optional(),
  adminNotes: z.string().optional().nullable(),
  clientNotes: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  const { session, error } = await requirePermission('MANAGE_PUBLISHERS')
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
      return notFound('Publisher not found')
    }

    const row = result.rows[0]

    return ok({
      publisher: {
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
    console.error('Get publisher API error:', error)
    return serverError('Failed to fetch publisher')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  const { session, error } = await requirePermission('MANAGE_PUBLISHERS')
  if (error || !session) {
    return unauthorized(error?.message || 'Unauthorized')
  }

  try {
    const { id } = await params
    const rawBody = await request.json()
    const data = updatePublisherSchema.parse(rawBody)

    const pool = getPool()

    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (data.publisherName !== undefined) {
      updateFields.push(`publisher_name = $${paramIndex}`)
      updateValues.push(data.publisherName)
      paramIndex++
    }

    if (data.email !== undefined) {
      updateFields.push(`email = $${paramIndex}`)
      updateValues.push(data.email)
      paramIndex++
    }

    if (data.companyName !== undefined) {
      updateFields.push(`company_name = $${paramIndex}`)
      updateValues.push(data.companyName)
      paramIndex++
    }

    if (data.telegramId !== undefined) {
      updateFields.push(`telegram_id = $${paramIndex}`)
      updateValues.push(data.telegramId)
      paramIndex++
    }

    if (data.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(data.status)
      paramIndex++
    }

    if (data.adminNotes !== undefined) {
      updateFields.push(`admin_notes = $${paramIndex}`)
      updateValues.push(data.adminNotes)
      paramIndex++
    }

    if (data.clientNotes !== undefined) {
      updateFields.push(`client_notes = $${paramIndex}`)
      updateValues.push(data.clientNotes)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return badRequest('No fields to update')
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(id)

    const result = await pool.query(
      `
      UPDATE publisher_requests
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
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
      updateValues
    )

    if (result.rowCount === 0) {
      return notFound('Publisher not found')
    }

    const row = result.rows[0]

    auditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: 'PUBLISHER_UPDATED',
      entity: 'publisher',
      entityId: row.id,
      metadata: {
        email: row.email,
        updatedFields: Object.keys(data),
      },
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] ??
          request.headers.get('x-real-ip') ??
          undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return ok({
      publisher: {
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
    console.error('Update publisher API error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return badRequest('Validation error', { details: zodError.errors })
    }
    return serverError('Failed to update publisher')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  const { session, error } = await requirePermission('MANAGE_PUBLISHERS')
  if (error || !session) {
    return unauthorized(error?.message || 'Unauthorized')
  }

  try {
    const { id } = await params
    const pool = getPool()

    const result = await pool.query(
      `
      DELETE FROM publisher_requests
      WHERE id = $1
      RETURNING id
      `,
      [id]
    )

    if (result.rowCount === 0) {
      return notFound('Publisher not found')
    }

    auditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: 'PUBLISHER_DELETED',
      entity: 'publisher',
      entityId: id,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] ??
          request.headers.get('x-real-ip') ??
          undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return ok({ message: 'Publisher deleted successfully' })
  } catch (error: unknown) {
    console.error('Delete publisher API error:', error)
    return serverError('Failed to delete publisher')
  }
}

