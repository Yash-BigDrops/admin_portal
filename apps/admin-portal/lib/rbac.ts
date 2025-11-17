import { auth } from '@/lib/auth'
import { getPool } from '@repo/database'
import { PERMISSIONS, can } from '@repo/auth'

export { PERMISSIONS, can }

export const runtime = 'nodejs'

export interface Permission {
  resource: string
  action: string
}

export async function getCurrentUser() {
  const session = await auth()
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

export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  if (user.role === 'super_admin') return true
  
  const userPermissions = user.permissions || []
  return userPermissions.includes(permission)
}

export async function requirePermission(permission: string) {
  const hasAccess = await hasPermission(permission)
  if (!hasAccess) {
    throw new Error(`Access denied. Required permission: ${permission}`)
  }
}

