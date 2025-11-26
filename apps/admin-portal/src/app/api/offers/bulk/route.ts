import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { bulkUpdateOffers } from '@/domain/offers'

const bulkUpdateSchema = z.object({
  offerIds: z.array(z.string().uuid()).min(1, 'At least one offer ID is required'),
  updates: z.object({
    visibility: z.enum(['hidden', 'internal', 'public']).optional(),
    brandGuidelinesUrl: z
      .union([z.string().url(), z.literal(''), z.null()])
      .optional()
      .transform((val) => (val === '' ? null : val)),
    notes: z.string().max(2000).optional().nullable(),
  }),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const h = await headers()
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      h.get('x-real-ip') ||
      'unknown'

    const userId = (session.user as any)?.id || session.user?.email || 'unknown'
    const identifier = `user:${userId}:${ip}`

    const { allowed } = await rateLimit(
      {
        prefix: 'offers-bulk-update',
        windowSeconds: 60,
        maxRequests: 10,
      },
      identifier,
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many bulk update requests. Please wait a minute.' },
        { status: 429 },
      )
    }

    const body = await req.json()
    const parsed = bulkUpdateSchema.parse(body)

    const updated = await bulkUpdateOffers(parsed.offerIds, parsed.updates)

    return NextResponse.json({
      success: true,
      updated: updated.length,
      offerIds: updated,
    })
  } catch (err) {
    console.error('[offers/bulk] PATCH error:', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: err.issues },
        { status: 400 },
      )
    }
    return NextResponse.json(
      {
        error: 'Failed to update offers',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

