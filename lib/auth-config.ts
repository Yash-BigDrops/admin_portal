import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { getPool } from "@/lib/database/db"
import bcrypt from "bcryptjs"

export const runtime = 'nodejs'

export const authConfig: NextAuthConfig = {
  session: { 
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: true,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }
        
        try {
          console.log('Attempting to authorize user:', credentials.email)
          const pool = getPool()
          const user = await pool.query(`
            SELECT id, email, first_name, last_name, role, password_hash, is_active
            FROM users
            WHERE email = $1 AND is_active = true
          `, [credentials.email as string])
          
          console.log('User query result:', user.rows.length > 0 ? 'User found' : 'No user found')
          
          if (user.rows.length === 0) {
            console.log('No user found with email:', credentials.email)
            return null
          }
          
          const userData = user.rows[0]
          console.log('User data found:', { 
            id: userData.id, 
            email: userData.email, 
            role: userData.role,
            hasPasswordHash: !!userData.password_hash 
          })
          
          if (!userData.password_hash) {
            console.log('No password hash found for user')
            return null
          }
          
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string, 
            userData.password_hash
          )
          
          console.log('Password validation result:', isPasswordValid)
          
          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email)
            return null
          }
          
          console.log('Authentication successful for user:', credentials.email)
          return {
            id: userData.id,
            email: userData.email,
            name: `${userData.first_name} ${userData.last_name}`,
            role: userData.role
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If the URL is relative, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // If the URL is on the same domain, allow it
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token)
      console.log('Session callback - session before:', session)
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      console.log('Session callback - session after:', session)
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
}
