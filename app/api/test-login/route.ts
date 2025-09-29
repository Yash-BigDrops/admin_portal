import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    const pool = getPool();
    
    // Get user by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        message: 'No user found with this email'
      }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password',
        message: 'Password does not match'
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      environment: {
        jwt_secret_exists: !!process.env.JWT_SECRET,
        refresh_token_secret_exists: !!process.env.REFRESH_TOKEN_SECRET
      }
    });
    
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Login test failed'
      },
      { status: 500 }
    );
  }
}
