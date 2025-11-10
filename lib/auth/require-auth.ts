import { auth } from '@/lib/auth'
import { PERMISSIONS, can } from '@/lib/rbac'

export type RequirePermission = keyof typeof PERMISSIONS

export async function requireAuth() {
  const session = await auth()

  if (!session || !session.user) {
    return { session: null, error: { status: 401, message: 'Unauthorized' } }
  }

  return { session, error: null }
}

export async function requirePermission(permission: RequirePermission) {
  const { session, error } = await requireAuth()
  if (error || !session) return { session: null, error }

  const user = session.user
  const userRole = user.role as string

  if (!can(userRole, PERMISSIONS[permission])) {
    return { session: null, error: { status: 403, message: 'Forbidden' } }
  }

  return { session, error: null }
}

