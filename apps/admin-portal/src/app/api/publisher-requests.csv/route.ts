import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth-helpers'
import { getPublisherRequestsForAdmin } from '@/domain/publisher-requests'
import type { PublisherRequestStatus } from '@/domain/publisher-requests'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') as
      | PublisherRequestStatus
      | null
    const q = url.searchParams.get('q')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    const result = await getPublisherRequestsForAdmin({
      status: status || undefined,
      search: q || undefined,
      page: 1,
      pageSize: 10000,
    })

    let rows = result.data

    if (from || to) {
      rows = rows.filter((r) => {
        const createdAt = new Date(r.created_at)
        if (from && createdAt < new Date(from)) return false
        if (to && createdAt > new Date(to)) return false
        return true
      })
    }

    const header =
      'id,offer_id,company,email,creative_type,status,created_at,updated_at\n'
    const body = rows
      .map((r) =>
        [
          r.id,
          r.offer_id,
          r.company,
          r.email,
          r.creative_type,
          r.status,
          r.created_at,
          r.updated_at,
        ]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    return new NextResponse(header + body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="publisher_requests.csv"',
      },
    })
  } catch (error: any) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      { error: 'Failed to export CSV', details: error.message },
      { status: 500 }
    )
  }
}

