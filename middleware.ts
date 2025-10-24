import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup', 
    '/auth/error',
    '/api/auth',
    '/_next',
    '/favicon.ico'
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  const token = request.cookies.get('next-auth.session-token') || 
                request.cookies.get('__Secure-next-auth.session-token')
  
  if (token && pathname.startsWith('/auth/signin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  if (!token && !isPublicRoute) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
