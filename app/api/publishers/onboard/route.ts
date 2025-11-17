import { NextRequest, NextResponse } from 'next/server'

import { getPool } from '@/lib/database/db'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/logging/audit-log'
import { tooManyRequests, serverError, badRequest, ok } from '@/lib/http/responses'
import { z } from 'zod'

const onboardingSchema = z
  .object({
    publisherName: z.string().min(1, 'Publisher name is required'),
    email: z.string().email('Valid email is required'),
    companyName: z.string().min(1, 'Company name is required'),
    telegramId: z.string().optional().nullable(),
    offerId: z.string().min(1, 'Offer ID is required'),
    creativeType: z.string().min(1, 'Creative type is required'),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    additionalNotes: z.string().optional(),
  })
  // allow extra form fields (traffic sources, verticals, etc.)
  .passthrough()

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const { allowed } = rateLimit(ip, {
    windowMs: 60_000,
    max: 10,
  })

  if (!allowed) {
    return tooManyRequests('Too many requests')
  }

  try {
    const rawBody = await request.json()

    const data = onboardingSchema.parse(rawBody)

    const pool = getPool()

    const priority = data.priority ?? 'medium'

    const status = 'pending'

    const result = await pool.query(
      `
      INSERT INTO publisher_requests (
        publisher_name,
        email,
        company_name,
        telegram_id,
        offer_id,
        creative_type,
        priority,
        status,
        submitted_data,
        created_at,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
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
        created_at,
        updated_at
      `,
      [
        data.publisherName,
        data.email,
        data.companyName,
        data.telegramId ?? null,
        data.offerId,
        data.creativeType,
        priority,
        status,
        JSON.stringify({
          ...rawBody,
          source: 'publisher_onboarding_form',
          migrated_at: new Date().toISOString(),
        }),
      ]
    )

    const row = result.rows[0]

    auditLog({
      action: 'PUBLISHER_ONBOARDING_SUBMITTED',
      entity: 'publisher_request',
      entityId: row.id,
      metadata: {
        email: row.email,
        companyName: row.company_name,
      },
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] ??
          request.headers.get('x-real-ip') ??
          undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return ok(
      {
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
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Onboarding API error:', error)
    if (error instanceof z.ZodError) {
      return badRequest('Validation error', { details: error.errors })
    }

    return serverError('Failed to submit onboarding request')
  }
}

