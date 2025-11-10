import { getPool } from '@repo/database'

export const runtime = 'nodejs'

export interface Permission {
  resource: string
  action: string
}

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_PUBLISHERS: 'manage_publishers',
  MANAGE_OFFERS: 'manage_offers'
} as const

export async function getCurrentUser(authFn: () => Promise<any>) {
  const session = await authFn()
  if (!session?.user?.id) return null
  
  const pool = getPool()
  const user = await pool.query(`
    SELECT u.*, 
           COALESCE(
             json_agg(
               json_build_object(
                 'id', r.id,
                 'name', r.name,
                 'permissions', r.permissions
               )
             ) FILTER (WHERE r.id IS NOT NULL),
             '[]'
           ) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.id = $1 AND u.is_active = true
    GROUP BY u.id
  `, [session.user.id])
  
  if (user.rows.length === 0) return null
  
  const userData = user.rows[0]
  return {
    ...userData,
    roles: userData.roles.map((r: { name: string }) => r.name),
    permissions: userData.roles.flatMap((r: { permissions: string[] }) => r.permissions)
  }
}

export async function hasPermission(permission: string, authFn: () => Promise<any>): Promise<boolean> {
  const user = await getCurrentUser(authFn)
  if (!user) return false
  
  if (user.role === 'super_admin') return true
  
  const userPermissions = user.permissions || []
  return userPermissions.includes(permission)
}

export async function requirePermission(permission: string, authFn: () => Promise<any>) {
  const hasAccess = await hasPermission(permission, authFn)
  if (!hasAccess) {
    throw new Error(`Access denied. Required permission: ${permission}`)
  }
}

export function can(userRole: string, permission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    super_admin: Object.values(PERMISSIONS),
    admin: Object.values(PERMISSIONS),
    manager: [PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.MANAGE_PUBLISHERS, PERMISSIONS.MANAGE_OFFERS],
    editor: [PERMISSIONS.MANAGE_OFFERS, PERMISSIONS.VIEW_ANALYTICS],
    user: [PERMISSIONS.VIEW_ANALYTICS]
  }
  
  return rolePermissions[userRole]?.includes(permission) || false
}
