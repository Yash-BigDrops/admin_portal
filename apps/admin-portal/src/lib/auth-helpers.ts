import { auth } from '@/auth'
import type { Session } from 'next-auth'

export async function getAdminSession(): Promise<Session | null> {
  const session = await auth()
  if (!session) return null

  // Check if user has admin role
  const userRole = (session.user as any)?.role
  if (userRole !== 'admin') return null

  return session
}

