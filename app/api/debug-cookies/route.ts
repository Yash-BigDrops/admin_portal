import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cookies = request.cookies.getAll()
  
  return NextResponse.json({
    cookies: cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value.substring(0, 20) + '...' // Show first 20 chars
    })),
    hasNextAuthToken: cookies.some(cookie => 
      cookie.name === 'next-auth.session-token' || 
      cookie.name === '__Secure-next-auth.session-token'
    )
  })
}
