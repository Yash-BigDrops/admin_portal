import { auth } from '@/lib/auth'
import { ReactNode } from 'react'

interface RoleGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

// Simple role-based permissions without database dependency
function can(userRole: string, permission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    super_admin: ['manage_users', 'manage_settings', 'view_analytics', 'manage_publishers', 'manage_offers'],
    admin: ['manage_users', 'manage_settings', 'view_analytics', 'manage_publishers', 'manage_offers'],
    manager: ['view_analytics', 'manage_publishers', 'manage_offers'],
    editor: ['manage_offers', 'view_analytics'],
    user: ['view_analytics']
  }
  
  return rolePermissions[userRole]?.includes(permission) || false
}

export default async function RoleGuard({ 
  permission, 
  children, 
  fallback = null 
}: RoleGuardProps) {
  const session = await auth()
  
  if (!session?.user?.role) {
    return <>{fallback}</>
  }
  
  const hasAccess = can(session.user.role, permission)
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}
