import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { getPool } from '@repo/database'
import { UserRole } from '@repo/types'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.email = token.email as string
      }
      return session
    },
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing credentials')
          return null
        }

        try {
          const pool = getPool()
          const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [credentials.email]
          )

          if (result.rows.length === 0) {
            console.log('[Auth] User not found:', credentials.email)
            return null
          }

          const user = result.rows[0]
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          )

          if (!isValidPassword) {
            console.log('[Auth] Invalid password for:', credentials.email)
            return null
          }

          console.log('[Auth] Login successful for:', credentials.email)
          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role,
          }
        } catch (error) {
          console.error('[Auth] Error during authorization:', error)
          return null
        }
      },
    }),
  ],
})

