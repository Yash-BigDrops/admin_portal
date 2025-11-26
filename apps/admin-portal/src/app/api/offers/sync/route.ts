import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { getCredential } from '@/lib/credentials'
import { syncOffersFromEverflow } from '@/domain/offers'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any)?.id || session.user?.email || 'unknown'
    const h = await headers()
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      h.get('x-real-ip') ||
      'unknown'

    const identifier = `user:${userId}`

    const { allowed, remaining } = await rateLimit(
      {
        prefix: 'offers-sync',
        windowSeconds: 60 * 2, // 2 minute window
        maxRequests: 10, // Allow 10 syncs per 2 minutes (very lenient for manual operations)
      },
      identifier,
    )

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Too many sync requests. Please wait a few minutes before syncing again.',
          retryAfter: '2 minutes',
          remaining,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(60 * 2),
          },
        },
      )
    }

    // Get account name from query params (optional, defaults to first everflow credential)
    const url = new URL(req.url)
    const accountName = url.searchParams.get('account')

    // Try to get credential from DB first, fallback to env var for backward compatibility
    let apiKey: string | null = null

    try {
      const cred = await getCredential('everflow', accountName || undefined)
      if (cred) {
        apiKey = cred.api_key
      }
    } catch (error) {
      console.warn(
        '[offers/sync] Failed to get credential from DB, falling back to env:',
        error,
      )
    }

    // Fallback to env var if no credential found
    if (!apiKey) {
      apiKey = process.env.EVERFLOW_API_KEY || null
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Everflow API key not found. Add a credential in /credentials or set EVERFLOW_API_KEY in .env.local',
        },
        { status: 500 },
      )
    }

    let count: number
    try {
      count = await syncOffersFromEverflow(apiKey)
    } catch (error) {
      console.error('[offers/sync] syncOffersFromEverflow error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('No authentication method found')) {
        return NextResponse.json(
          {
            error: 'Everflow API authentication failed. The API key may be invalid or expired.',
            details: errorMessage,
            hint: 'Please check your API key in /credentials or .env.local. You may need to generate a new API key from your Everflow account.',
          },
          { status: 401 },
        )
      }
      
      return NextResponse.json(
        {
          error: 'Failed to fetch offers from Everflow',
          details: errorMessage,
        },
        { status: 500 },
      )
    }

    if (count === 0) {
      return NextResponse.json(
        {
          message: 'No offers returned from Everflow.',
          count: 0,
          debug: 'Check server logs for Everflow API errors',
          hint: 'Check terminal logs for [Everflow] error messages. The API may be returning an error or empty response.',
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      message: `Synced ${count} offers.`,
      count,
    })
  } catch (error) {
    console.error('[offers/sync] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync offers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

