import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database/db'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { requirePermission } from '@/lib/auth/require-auth'
import { auditLog } from '@/lib/logging/audit-log'
import { unauthorized, serverError, ok, badRequest } from '@/lib/http/responses'
import { z } from 'zod'

const createPublisherSchema = z.object({
  publisherName: z.string().min(1, 'Publisher name is required'),
  email: z.string().email('Valid email is required'),
  companyName: z.string().optional(),
  telegramId: z.string().optional().nullable(),
  status: z.enum(['active', 'pending', 'suspended']).optional().default('pending'),
  metadata: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  const { session, error } = await requirePermission('MANAGE_PUBLISHERS')
  if (error || !session) {
    return unauthorized(error?.message || 'Unauthorized')
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0)
    const searchQuery = searchParams.get('q') || ''
    const statusFilter = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'DESC'

    const pool = getPool()

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (searchQuery) {
      conditions.push(`(
        publisher_name ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        company_name ILIKE $${paramIndex}
      )`)
      params.push(`%${searchQuery}%`)
      paramIndex++
    }

    if (statusFilter) {
      conditions.push(`status = $${paramIndex}`)
      params.push(statusFilter)
      paramIndex++
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    const validSortColumns = ['created_at', 'publisher_name', 'email', 'company_name', 'status']
    const validSortOrder = ['ASC', 'DESC']
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

    params.push(limit, offset)

    const result = await pool.query(
      `
      SELECT 
        DISTINCT ON (email)
        id,
        publisher_name,
        email,
        company_name,
        telegram_id,
        status,
        submitted_data,
        created_at,
        updated_at
      FROM publisher_requests
      ${whereClause}
      ORDER BY email, ${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      params
    )

    const countResult = await pool.query(
      `
      SELECT COUNT(DISTINCT email) as total
      FROM publisher_requests
      ${whereClause}
      `,
      params.slice(0, -2)
    )

    const publishers = result.rows.map((row: any) => ({
      id: row.id,
      publisherName: row.publisher_name,
      email: row.email,
      companyName: row.company_name,
      telegramId: row.telegram_id,
      status: row.status || 'pending',
      submittedData: row.submitted_data,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return ok({
      publishers,
      total: parseInt(countResult.rows[0]?.total || '0', 10),
      limit,
      offset,
    })
  } catch (error: unknown) {
    console.error('Get publishers API error:', error)
    return serverError('Failed to fetch publishers')
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  const { session, error } = await requirePermission('MANAGE_PUBLISHERS')
  if (error || !session) {
    return unauthorized(error?.message || 'Unauthorized')
  }

  try {
    const rawBody = await request.json()
    const data = createPublisherSchema.parse(rawBody)

    const pool = getPool()

    const result = await pool.query(
      `
      INSERT INTO publisher_requests (
        publisher_name,
        email,
        company_name,
        telegram_id,
        status,
        submitted_data,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING 
        id,
        publisher_name,
        email,
        company_name,
        telegram_id,
        status,
        submitted_data,
        created_at,
        updated_at
      `,
      [
        data.publisherName,
        data.email,
        data.companyName || null,
        data.telegramId || null,
        data.status,
        JSON.stringify({
          ...data.metadata,
          source: 'admin_created',
          created_by: session.user.id,
        }),
      ]
    )

    const row = result.rows[0]

    auditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: 'PUBLISHER_CREATED',
      entity: 'publisher',
      entityId: row.id,
      metadata: {
        email: row.email,
        publisherName: row.publisher_name,
      },
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] ??
          request.headers.get('x-real-ip') ??
          undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return ok(
      {
        publisher: {
          id: row.id,
          publisherName: row.publisher_name,
          email: row.email,
          companyName: row.company_name,
          telegramId: row.telegram_id,
          status: row.status,
          submittedData: row.submitted_data,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Create publisher API error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return badRequest('Validation error', { details: zodError.errors })
    }
    return serverError('Failed to create publisher')
  }
}

