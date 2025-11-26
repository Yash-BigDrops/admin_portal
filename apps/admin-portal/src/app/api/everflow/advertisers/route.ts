import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.EVERFLOW_API_KEY
    const base =
      process.env.EVERFLOW_API_URL ?? 'https://api.eflow.team/v1'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'EVERFLOW_API_KEY missing' },
        { status: 500 },
      )
    }

    const res = await fetch(`${base}/networks/advertisers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Eflow-API-Key': apiKey,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Everflow API error: ${res.status}`,
          status: res.status,
          statusText: res.statusText,
        },
        { status: res.status },
      )
    }

    const json = await res.json()

    // Return both raw response and parsed structure for debugging
    return NextResponse.json({
      status: res.status,
      raw: json,
      sample: Array.isArray(json)
        ? json.slice(0, 3)
        : json.advertisers
          ? json.advertisers.slice(0, 3)
          : json.data?.advertisers
            ? json.data.advertisers.slice(0, 3)
            : json.data
              ? json.data.slice(0, 3)
              : null,
      structure: {
        isArray: Array.isArray(json),
        hasAdvertisers: !!json.advertisers,
        hasData: !!json.data,
        keys: Object.keys(json).slice(0, 10),
      },
    })
  } catch (error) {
    console.error('[everflow/advertisers] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch advertisers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

