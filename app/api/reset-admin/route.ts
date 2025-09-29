import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const pool = getPool();
    
    // Hash the correct password
    const correctPassword = 'AdminPortal@2025';
    const hashedPassword = await bcrypt.hash(correctPassword, 12);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete existing admin user
      await client.query('DELETE FROM users WHERE email = $1', ['admin@bigdrops.com']);
      
      // Insert new admin user with correct password
      const result = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, role, created_at
      `, [
        'admin@bigdrops.com', 
        hashedPassword, 
        'Super', 
        'Admin', 
        'super_admin', 
        true
      ]);
      
      await client.query('COMMIT');
      
      const newUser = result.rows[0];
      
      // Verify the password works
      const passwordMatch = await bcrypt.compare(correctPassword, hashedPassword);
      
      return NextResponse.json({
        success: true,
        message: 'Admin user reset successfully with correct password',
        user: newUser,
        password_verification: {
          correct_password: correctPassword,
          password_matches: passwordMatch,
          hash_preview: hashedPassword.substring(0, 30) + '...'
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Reset admin error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to reset admin user'
      },
      { status: 500 }
    );
  }
}
