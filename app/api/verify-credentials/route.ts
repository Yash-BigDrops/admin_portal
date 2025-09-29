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
        message: 'Admin user not found in database',
        user: null
      });
    }
    
    const user = userResult.rows[0];
    
    // Test password verification with the expected password
    const expectedPassword = 'AdminPortal@2025';
    const passwordMatch = await bcrypt.compare(expectedPassword, user.password_hash);
    
    // Also test with a few variations
    const variations = [
      'AdminPortal@2025',
      'admin@bigdrops.com',
      'admin',
      'password',
      '123456'
    ];
    
    const passwordTests = [];
    for (const testPassword of variations) {
      const match = await bcrypt.compare(testPassword, user.password_hash);
      passwordTests.push({ password: testPassword, match });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User verification completed',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        created_at: user.created_at,
        password_hash_preview: user.password_hash.substring(0, 30) + '...',
        password_length: user.password_hash.length
      },
      password_tests: passwordTests,
      expected_password: expectedPassword,
      password_matches_expected: passwordMatch,
      environment: {
        jwt_secret_exists: !!process.env.JWT_SECRET,
        refresh_token_secret_exists: !!process.env.REFRESH_TOKEN_SECRET,
        node_env: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('Verify credentials error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to verify credentials'
      },
      { status: 500 }
    );
  }
}
