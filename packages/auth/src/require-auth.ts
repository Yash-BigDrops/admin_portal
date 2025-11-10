import { PERMISSIONS, can } from './rbac'

export type RequirePermission = keyof typeof PERMISSIONS

// Note: This will need to import auth from the app-specific auth setup
// For now, keeping it flexible
export async function requireAuth(authFn: () => Promise<any>) {
  const session = await authFn()

  if (!session || !session.user) {
    return { session: null, error: { status: 401, message: 'Unauthorized' } }
  }

  return { session, error: null }
}

export async function requirePermission(
  permission: RequirePermission,
  authFn: () => Promise<any>
) {
  const { session, error } = await requireAuth(authFn)
  if (error || !session) return { session: null, error }

  const user = session.user
  const userRole = user.role as string

  if (!can(userRole, PERMISSIONS[permission])) {
    return { session: null, error: { status: 403, message: 'Forbidden' } }
  }

  return { session, error: null }
}
