import type { Session } from 'next-auth'

// This function will be re-exported from the app with the actual auth instance
// See apps/admin-portal/src/lib/auth-helpers.ts
export type GetAdminSession = () => Promise<Session | null>

// Placeholder - actual implementation is in the app
export async function getAdminSession(): Promise<Session | null> {
  // This will be overridden by the app's implementation
  return null
}

