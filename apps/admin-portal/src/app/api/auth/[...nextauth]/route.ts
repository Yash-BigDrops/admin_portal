import { handlers } from '@/auth'
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

const { GET, POST: originalPOST } = handlers

export { GET }

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const isCredentialsCallback = url.pathname.endsWith('/callback/credentials')

  if (isCredentialsCallback) {
    const h = await headers()
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      h.get('x-real-ip') ||
      'unknown'

    const { allowed } = await rateLimit(
      {
        prefix: 'login',
        windowSeconds: 60,
        maxRequests: 10,
      },
      ip,
    )

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many login attempts. Please try again later.',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  }

  return originalPOST(req)
}

