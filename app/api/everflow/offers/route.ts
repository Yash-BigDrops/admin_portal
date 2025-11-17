import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.EVERFLOW_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Everflow API key not configured' }, { status: 500 })
    }

    const url = new URL('https://api.eflow.team/v1/network/offers')
    const searchParams = request.nextUrl.searchParams
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    const response = await fetch(url.toString(), {
      headers: {
        'API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Everflow API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Everflow offers API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers data' },
      { status: 500 }
    )
  }
}
