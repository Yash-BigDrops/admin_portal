import { NextResponse } from 'next/server'
import { auth } from '@repo/auth'

export async function GET() {
  try {
    // NextAuth v5 handles CSRF automatically, but we can return a token if needed
    // For NextAuth v5, CSRF protection is built-in and doesn't require manual token fetching
    // This endpoint exists for compatibility with the frontend code
    return NextResponse.json({ 
      csrfToken: 'next-auth-csrf-token' // NextAuth v5 handles this automatically
    })
  } catch (error) {
    console.error('CSRF token error:', error)
    return NextResponse.json(
      { error: 'Failed to get CSRF token' },
      { status: 500 }
    )
  }
}

