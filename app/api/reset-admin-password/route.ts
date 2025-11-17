import { NextResponse } from 'next/server'
import { getPool } from '@/lib/database/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    const pool = getPool()
    
    // Hash the password with the same method used in auth
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Update the admin user's password
    const result = await pool.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE email = $2
      RETURNING id, email, first_name, last_name, role
    `, [hashedPassword, 'admin@bigdrops.com'])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Admin user not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin password reset successfully',
      user: result.rows[0],
      passwordHash: hashedPassword.substring(0, 20) + '...' // Show first 20 chars for debugging
    })
    
  } catch (error: unknown) {
    console.error('Error resetting admin password:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset admin password' },
      { status: 500 }
    )
  }
}
