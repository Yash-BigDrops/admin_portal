import NextAuth from "next-auth"
import { simpleAuthConfig } from "./simple-auth-config"

export const { handlers, auth, signIn, signOut } = NextAuth(simpleAuthConfig)
