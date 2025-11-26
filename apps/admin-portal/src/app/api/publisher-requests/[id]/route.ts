import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getAdminSession } from '@/lib/auth-helpers'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { updateRequestStatus } from '@/domain/publisher-requests'

const PatchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  admin_notes: z.string().max(2000).optional(),
})

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown'

    const { allowed } = await rateLimit(
      {
        prefix: 'publisher-requests-patch',
        windowSeconds: 10,
        maxRequests: 5,
      },
      ip,
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid id format' }, { status: 400 })
    }

    let body
    try {
      body = PatchSchema.parse(await req.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 },
        )
      }
      throw error
    }

    const updated = await updateRequestStatus(
      id,
      {
        status: body.status,
        admin_notes: body.admin_notes,
      },
      session.user?.email || 'unknown',
    )

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error('[publisher-requests/:id] PATCH error:', err)
    if (err instanceof Error && err.message.includes('not found')) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    return NextResponse.json(
      {
        error: 'Failed to update publisher request',
        details: err?.message ?? 'unknown',
      },
      { status: 500 },
    )
  }
}

