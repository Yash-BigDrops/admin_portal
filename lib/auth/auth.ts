import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../database/db';
import type { User, UserRole } from '../../types/database';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT tokens
  static generateTokens(user: User): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'admin-portal',
      audience: 'admin-portal',
    });

    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: '7d',
      issuer: 'admin-portal',
      audience: 'admin-portal',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'admin-portal',
        audience: 'admin-portal',
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET, {
        issuer: 'admin-portal',
        audience: 'admin-portal',
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role as UserRole,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Create user session
  static async createSession(
    userId: string,
    tokens: AuthTokens,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    const pool = getPool();
    const tokenHash = await bcrypt.hash(tokens.accessToken, 10);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    await pool.query(
      `INSERT INTO user_sessions 
       (user_id, token_hash, refresh_token_hash, expires_at, user_agent, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, tokenHash, refreshTokenHash, expiresAt, userAgent, ipAddress]
    );
  }

  // Update last login
  static async updateLastLogin(userId: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  // Create super admin user (for initial setup)
  static async createSuperAdmin(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<User> {
    const pool = getPool();
    
    // Check if super admin already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE role = $1',
      ['super_admin']
    );

    if (existing.rows.length > 0) {
      throw new Error('Super admin already exists');
    }

    const passwordHash = await this.hashPassword(password);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [email, passwordHash, firstName, lastName, 'super_admin', true]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role as UserRole,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
