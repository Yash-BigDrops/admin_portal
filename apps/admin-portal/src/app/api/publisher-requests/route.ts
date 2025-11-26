import { getAdminSession } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { getPublisherRequestsForAdmin } from '@/domain/publisher-requests'
import type { PublisherRequestStatus } from '@/domain/publisher-requests'

export async function GET(req: NextRequest) {
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
      prefix: 'publisher-requests-get',
      windowSeconds: 60,
      maxRequests: 60,
    },
    ip,
  )

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') as
      | PublisherRequestStatus
      | null
    const q = url.searchParams.get('q')
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)),
    )

    const result = await getPublisherRequestsForAdmin({
      status: status || undefined,
      search: q || undefined,
      page,
      pageSize,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[publisher-requests] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load publisher requests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

