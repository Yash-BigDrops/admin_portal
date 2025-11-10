import { User, UserRole } from './database'

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
  otpCode?: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}

