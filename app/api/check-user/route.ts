import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const pool = getPool();
    
    // Get the admin user
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@bigdrops.com']);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Admin user not found',
        user: null
      });
    }
    
    const user = userResult.rows[0];
    
    // Test password verification
    const testPassword = 'AdminPortal@2025';
    const passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
    
    return NextResponse.json({
      success: true,
      message: 'User found',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        created_at: user.created_at,
        password_hash: user.password_hash.substring(0, 20) + '...',
        password_match: passwordMatch
      },
      environment: {
        jwt_secret_exists: !!process.env.JWT_SECRET,
        refresh_token_secret_exists: !!process.env.REFRESH_TOKEN_SECRET,
        node_env: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check user'
      },
      { status: 500 }
    );
  }
}
