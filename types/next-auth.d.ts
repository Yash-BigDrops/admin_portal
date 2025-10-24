import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    name?: string | null
    email?: string | null
    role?: string
    roles?: string[]
    permissions?: string[]
  }

  interface Session {
    user: User
  }
}
