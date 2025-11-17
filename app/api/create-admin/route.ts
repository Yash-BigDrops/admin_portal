import { NextResponse } from 'next/server'
import { getPool } from '@/lib/database/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    const pool = getPool()
    
    // Check if admin user exists
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['admin@bigdrops.com']
    )
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        user: existingUser.rows[0]
      })
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const result = await pool.query(`
      INSERT INTO users (email, first_name, last_name, role, password_hash, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, email, first_name, last_name, role
    `, [
      'admin@bigdrops.com',
      'Admin',
      'User',
      'super_admin',
      hashedPassword,
      true
    ])
    
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: result.rows[0]
    })
    
  } catch (error: unknown) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}
