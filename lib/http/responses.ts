import { NextResponse } from 'next/server'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, ...data }, init)
}

export function badRequest(message = 'Bad request', extra?: object) {
  return NextResponse.json(
    { success: false, error: message, ...extra },
    { status: 400 }
  )
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  )
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  )
}

export function notFound(message = 'Not found') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 404 }
  )
}

export function tooManyRequests(message = 'Too many requests') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 429 }
  )
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  )
}

