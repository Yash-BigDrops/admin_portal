import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { getOffersForAdminPage, createOffer } from '@/domain/offers'
import type { OfferVisibility } from '@/domain/offers'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      console.error('[offers] GET: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if ((session.user as any)?.role !== 'admin') {
      console.error(
        '[offers] GET: User role is not admin:',
        (session.user as any)?.role,
      )
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') || 'active'
    const visibility = searchParams.get('visibility') as
      | OfferVisibility
      | null
    const sort = (searchParams.get('sort') ||
      'id_desc') as 'id_desc' | 'id_asc' | 'name_asc' | 'name_desc'
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '500', 10),
      1000,
    )
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const items = await getOffersForAdminPage({
      sort,
      limit,
      offset,
      status,
      visibility: visibility || undefined,
    })

    return NextResponse.json({
      items,
      limit,
      offset,
      sort,
    })
  } catch (error) {
    console.error('[offers] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load offers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

const createManualOfferSchema = z.object({
  offerId: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  advertiserId: z.string().max(100).optional().nullable(),
  advertiserName: z.string().max(255).optional().nullable(),
  status: z.enum(['active', 'paused', 'disabled']).default('active'),
  visibility: z.enum(['hidden', 'internal', 'public']).default('hidden'),
  brandGuidelinesUrl: z
    .union([z.string().url(), z.literal(''), z.null()])
    .optional()
    .transform((val) => (val === '' ? null : val)),
  notes: z.string().max(2000).optional().nullable(),
})

export async function POST(req: NextRequest) {
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
        prefix: 'offers-create-manual',
        windowSeconds: 60,
        maxRequests: 20,
      },
      identifier,
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many creation requests. Please wait a minute.' },
        { status: 429 },
      )
    }

    const body = await req.json()
    const parsed = createManualOfferSchema.parse(body)

    const offer = await createOffer({
      offerId: parsed.offerId,
      name: parsed.name,
      advertiserId: parsed.advertiserId,
      advertiserName: parsed.advertiserName,
      status: parsed.status,
      visibility: parsed.visibility,
      brandGuidelinesUrl: parsed.brandGuidelinesUrl,
      notes: parsed.notes,
    })

    return NextResponse.json({ success: true, offer }, { status: 201 })
  } catch (err) {
    console.error('[offers] POST error:', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: err.issues },
        { status: 400 },
      )
    }
    if (err instanceof Error && err.message.includes('already exists')) {
      return NextResponse.json(
        { error: err.message },
        { status: 409 },
      )
    }
    return NextResponse.json(
      {
        error: 'Failed to create manual offer',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

