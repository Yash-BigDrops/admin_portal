import NextAuth from 'next-auth'
import { authConfig } from '@repo/auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
})

