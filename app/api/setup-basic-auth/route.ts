import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function POST() {
  try {
    const pool = getPool();
    
    console.log('Setting up basic NextAuth.js tables...');
    
    // Create users table with NextAuth.js compatible schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        email_verified TIMESTAMP,
        image TEXT,
        role TEXT DEFAULT 'user',
        password TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create accounts table
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

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_token TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        expires TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create verification_tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      );
    `);

    // Add foreign key constraints
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

    // Insert a test admin user (password: AdminPortal@2025)
    await pool.query(`
      INSERT INTO users (email, password, name, role, email_verified) 
      VALUES (
        'admin@bigdrops.com', 
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzK4aO', 
        'Super Admin',
        'super_admin', 
        NOW()
      ) ON CONFLICT (email) DO NOTHING;
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
    `);

    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'accounts', 'sessions', 'verification_tokens');
    `);

    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');

    console.log('Basic NextAuth.js setup completed successfully!');
    console.log('Tables created:', tablesResult.rows.map(row => row.table_name));
    console.log('Users count:', userCount.rows[0].count);

    return NextResponse.json({
      success: true,
      message: 'Basic NextAuth.js setup completed successfully!',
      tables: tablesResult.rows.map(row => row.table_name),
      stats: {
        users: parseInt(userCount.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Basic NextAuth.js setup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Basic NextAuth.js setup failed'
      },
      { status: 500 }
    );
  }
}
