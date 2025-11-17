import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function GET() {
  try {
    const pool = getPool();
    
    // Check user_roles table schema
    const userRolesSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_roles' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    // Check if there are any users
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    
    // Check if there are any roles
    const rolesCount = await pool.query('SELECT COUNT(*) as count FROM roles');
    
    // Check if there are any user_roles
    const userRolesCount = await pool.query('SELECT COUNT(*) as count FROM user_roles');
    
    // Try to get a sample user with roles
    const sampleUser = await pool.query(`
      SELECT u.id, u.email, u.role, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', r.id,
                   'name', r.name,
                   'permissions', r.permissions
                 )
               ) FILTER (WHERE r.id IS NOT NULL),
               '[]'
             ) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id::text = ur.user_id::text
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = 'admin@bigdrops.com'
      GROUP BY u.id
      LIMIT 1;
    `);
    
    return NextResponse.json({
      success: true,
      userRolesSchema: userRolesSchema.rows,
      counts: {
        users: parseInt(usersCount.rows[0]?.count || '0', 10),
        roles: parseInt(rolesCount.rows[0]?.count || '0', 10),
        userRoles: parseInt(userRolesCount.rows[0]?.count || '0', 10)
      },
      sampleUser: sampleUser.rows[0] || null
    });

  } catch (error: unknown) {
    console.error('Check user_roles error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
