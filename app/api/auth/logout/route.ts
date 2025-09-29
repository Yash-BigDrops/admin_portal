import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (token) {
      // Hash the token to match what's stored in database
      const tokenHash = await bcrypt.hash(token, 10);
      
      // Remove session from database
      const pool = getPool();
      await pool.query(
        'DELETE FROM user_sessions WHERE token_hash = $1',
        [tokenHash]
      );
    }

    // Clear cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
