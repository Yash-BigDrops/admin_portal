import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function POST() {
  try {
    const pool = getPool();
    
    console.log('Setting up roles and fixing user_roles table...');
    
    // First, fix the user_roles table schema
    const userRolesCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_roles' AND column_name = 'user_id' AND table_schema = 'public'
    `);
    
    if (userRolesCheck.rows[0]?.data_type === 'integer') {
      console.log('Converting user_roles.user_id from integer to UUID...');
      
      // Add a new UUID column
      await pool.query(`
        ALTER TABLE user_roles ADD COLUMN user_id_uuid UUID;
      `);
      
      // Update the new column with converted values
      await pool.query(`
        UPDATE user_roles 
        SET user_id_uuid = (
          SELECT id FROM users 
          WHERE users.id::text = user_roles.user_id::text
        );
      `);
      
      // Drop the old column and rename the new one
      await pool.query(`
        ALTER TABLE user_roles DROP COLUMN user_id;
      `);
      
      await pool.query(`
        ALTER TABLE user_roles RENAME COLUMN user_id_uuid TO user_id;
      `);
      
      // Add NOT NULL constraint
      await pool.query(`
        ALTER TABLE user_roles ALTER COLUMN user_id SET NOT NULL;
      `);
    }
    
    // Insert default roles (check if they exist first)
    const existingRoles = await pool.query('SELECT name FROM roles');
    const existingRoleNames = existingRoles.rows.map(row => row.name);
    
    const rolesToInsert = [
      { name: 'super_admin', description: 'Full system access', permissions: '["manage_users", "manage_settings", "view_analytics", "manage_publishers", "manage_offers"]' },
      { name: 'admin', description: 'Administrative access', permissions: '["manage_users", "manage_settings", "view_analytics", "manage_publishers", "manage_offers"]' },
      { name: 'manager', description: 'Management level access', permissions: '["view_analytics", "manage_publishers", "manage_offers"]' },
      { name: 'editor', description: 'Content editing access', permissions: '["manage_offers", "view_analytics"]' },
      { name: 'user', description: 'Basic user access', permissions: '["view_analytics"]' }
    ];
    
    for (const role of rolesToInsert) {
      if (!existingRoleNames.includes(role.name)) {
        await pool.query(`
          INSERT INTO roles (name, description, permissions) 
          VALUES ($1, $2, $3)
        `, [role.name, role.description, role.permissions]);
      }
    }
    
    // Assign super_admin role to the admin user
    const existingUserRole = await pool.query(`
      SELECT COUNT(*) as count 
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email = 'admin@bigdrops.com' AND r.name = 'super_admin'
    `);
    
    if (parseInt(existingUserRole.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO user_roles (user_id, role_id)
        SELECT u.id, r.id
        FROM users u, roles r
        WHERE u.email = 'admin@bigdrops.com' AND r.name = 'super_admin'
      `);
    }
    
    // Re-add foreign key constraints
    try {
      await pool.query(`
        ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
    } catch (e) {
      // Constraint might already exist
    }
    
    try {
      await pool.query(`
        ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_role 
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
      `);
    } catch (e) {
      // Constraint might already exist
    }
    
    // Verify the setup
    const rolesCount = await pool.query('SELECT COUNT(*) as count FROM roles');
    const userRolesCount = await pool.query('SELECT COUNT(*) as count FROM user_roles');
    
    // Test the query that auth uses
    const testUser = await pool.query(`
      SELECT u.*, 
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
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = 'admin@bigdrops.com' AND u.is_active = true
      GROUP BY u.id
    `);
    
    console.log('Roles setup completed successfully!');
    console.log('Roles count:', rolesCount.rows[0].count);
    console.log('User roles count:', userRolesCount.rows[0].count);
    console.log('Test user roles:', testUser.rows[0]?.roles?.length || 0);
    
    return NextResponse.json({
      success: true,
      message: 'Roles setup completed successfully!',
      counts: {
        roles: parseInt(rolesCount.rows[0].count),
        userRoles: parseInt(userRolesCount.rows[0].count)
      },
      testUser: testUser.rows[0] || null
    });

  } catch (error) {
    console.error('Roles setup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Roles setup failed'
      },
      { status: 500 }
    );
  }
}
