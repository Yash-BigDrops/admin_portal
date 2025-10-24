import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function POST() {
  try {
    const pool = getPool();
    
    console.log('Setting up NextAuth.js database schema...');
    
    // Create NextAuth.js required tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at BIGINT,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_token TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        expires TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Update users table to match NextAuth.js schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        email_verified TIMESTAMP,
        image TEXT,
        role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'manager', 'editor', 'user')),
        password TEXT,
        first_name TEXT,
        last_name TEXT,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      );
    `);

    // Create RBAC tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        permissions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_roles table without foreign key constraints first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        role_id INTEGER,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        UNIQUE(user_id, role_id)
      );
    `);

    // Add foreign key constraints after all tables are created
    try {
      await pool.query(`
        ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
    } catch (e) {
      // Constraint might already exist
    }

    try {
      await pool.query(`
        ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
    } catch (e) {
      // Constraint might already exist
    }

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

    try {
      await pool.query(`
        ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES users(id);
      `);
    } catch (e) {
      // Constraint might already exist
    }

    // Insert default roles
    await pool.query(`
      INSERT INTO roles (name, description, permissions) VALUES 
      ('super_admin', 'Full system access', '["manage_users", "manage_settings", "view_analytics", "manage_publishers", "manage_offers"]'),
      ('admin', 'Administrative access', '["manage_users", "manage_settings", "view_analytics", "manage_publishers", "manage_offers"]'),
      ('manager', 'Management level access', '["view_analytics", "manage_publishers", "manage_offers"]'),
      ('editor', 'Content editing access', '["manage_offers", "view_analytics"]'),
      ('user', 'Basic user access', '["view_analytics"]')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Insert super admin user (password: AdminPortal@2025)
    await pool.query(`
      INSERT INTO users (email, password, first_name, last_name, name, role, email_verified) 
      VALUES (
        'admin@bigdrops.com', 
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzK4aO', 
        'Super', 
        'Admin',
        'Super Admin',
        'super_admin', 
        NOW()
      ) ON CONFLICT (email) DO NOTHING;
    `);

    // Assign super_admin role to the admin user
    await pool.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id
      FROM users u, roles r
      WHERE u.email = 'admin@bigdrops.com' AND r.name = 'super_admin'
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
    `);

    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'accounts', 'sessions', 'verification_tokens', 'roles', 'user_roles');
    `);

    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const roleCount = await pool.query('SELECT COUNT(*) as count FROM roles');

    console.log('NextAuth.js database setup completed successfully!');
    console.log('Tables created:', tablesResult.rows.map(row => row.table_name));
    console.log('Users count:', userCount.rows[0].count);
    console.log('Roles count:', roleCount.rows[0].count);

    return NextResponse.json({
      success: true,
      message: 'NextAuth.js database setup completed successfully!',
      tables: tablesResult.rows.map(row => row.table_name),
      stats: {
        users: parseInt(userCount.rows[0].count),
        roles: parseInt(roleCount.rows[0].count)
      }
    });

  } catch (error) {
    console.error('NextAuth.js database setup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'NextAuth.js database setup failed'
      },
      { status: 500 }
    );
  }
}
