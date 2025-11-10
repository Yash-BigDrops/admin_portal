export async function getAdminSession(
  authFn: () => Promise<any>
): Promise<any> {
  const session = await authFn()
  
  if (!session || !session.user) {
    return null
  }

  const userRole = (session.user as any).role as string
  const adminRoles = ['admin', 'super_admin']
  
  if (!adminRoles.includes(userRole)) {
    return null
  }

  return session
}

