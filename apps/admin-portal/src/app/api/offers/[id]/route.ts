import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { getOfferDetails, updateOffer } from '@/domain/offers'

const updateDetailsSchema = z.object({
  visibility: z.enum(['hidden', 'internal', 'public']).optional(),
  brandGuidelinesUrl: z
    .union([z.string().url(), z.literal(''), z.null()])
    .optional()
    .transform((val) => (val === '' ? null : val)),
  notes: z.string().max(2000).optional().nullable(),
  advertiserId: z.string().max(100).optional().nullable(),
  advertiserName: z.string().max(255).optional().nullable(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const offer = await getOfferDetails(id)

    if (!offer) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(offer)
  } catch (error) {
    console.error('[offers/:id] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch offer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = updateDetailsSchema.parse(body)

    const offer = await updateOffer(id, {
      visibility: parsed.visibility,
      brandGuidelinesUrl: parsed.brandGuidelinesUrl,
      notes: parsed.notes,
      advertiserId: parsed.advertiserId,
      advertiserName: parsed.advertiserName,
    })

    return NextResponse.json({ success: true, offer })
  } catch (err) {
    console.error('[offers/:id] PATCH error:', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: err.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        error: 'Failed to update offer',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

