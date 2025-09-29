import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function POST() {
  try {
    const pool = getPool();
    
    console.log('Setting up database tables...');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        last_login TIMESTAMP,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create user_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        refresh_token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used TIMESTAMP DEFAULT NOW(),
        user_agent TEXT,
        ip_address INET
      );
    `);

    // Create publisher_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS publisher_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        publisher_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        telegram_id VARCHAR(255),
        offer_id VARCHAR(255),
        creative_type VARCHAR(255),
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        submitted_data JSONB NOT NULL,
        admin_notes TEXT,
        client_notes TEXT,
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP,
        rejected_by UUID REFERENCES users(id),
        rejected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_publisher_requests_status ON publisher_requests(status);
      CREATE INDEX IF NOT EXISTS idx_publisher_requests_created_at ON publisher_requests(created_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    `);

    // Insert super admin user (password: AdminPortal@2025)
    await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
      VALUES (
        'admin@bigdrops.com', 
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzK4aO', 
        'Super', 
        'Admin', 
        'super_admin', 
        true
      ) ON CONFLICT (email) DO NOTHING;
    `);

    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'user_sessions', 'publisher_requests');
    `);

    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const requestCount = await pool.query('SELECT COUNT(*) as count FROM publisher_requests');

    console.log('Database setup completed successfully!');
    console.log('Tables created:', tablesResult.rows.map(row => row.table_name));
    console.log('Users count:', userCount.rows[0].count);
    console.log('Publisher requests count:', requestCount.rows[0].count);

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully!',
      tables: tablesResult.rows.map(row => row.table_name),
      stats: {
        users: parseInt(userCount.rows[0].count),
        publisher_requests: parseInt(requestCount.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Database setup failed'
      },
      { status: 500 }
    );
  }
}
