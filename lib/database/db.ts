import { Pool } from 'pg';

export const runtime = 'nodejs'

declare global {
  var __adminPortalPool__: Pool | undefined;
}

export function getPool(): Pool {
  const exists = globalThis.__adminPortalPool__;
  if (exists) return exists;

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  
  if (!url) {
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES')));
    throw new Error('DATABASE_URL environment variable is required');
  }

  const pool = new Pool({
    connectionString: url,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  globalThis.__adminPortalPool__ = pool;
  return pool;
}

// Database initialization function
export async function initializeDatabase() {
  const pool = getPool();
  
  try {
    console.log('🔄 Initializing Admin Portal database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Create tables
    await createTables(pool);
    console.log('✅ Database tables initialized');

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function createTables(pool: Pool) {
  // Users table (Admin, Super Admin, Client roles)
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

  // Sessions table for JWT token management
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

  // Publisher/Advertiser requests (from Publisher Portal)
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

  // Form configurations (dynamic form builder)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_configurations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      form_schema JSONB NOT NULL,
      is_active BOOLEAN DEFAULT true,
      version INTEGER DEFAULT 1,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Offer assignments (which publishers can see which offers)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS offer_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      publisher_email VARCHAR(255) NOT NULL,
      offer_id VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      assigned_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(publisher_email, offer_id)
    );
  `);

  // LLM training data collection
  await pool.query(`
    CREATE TABLE IF NOT EXISTS llm_training_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id UUID REFERENCES publisher_requests(id) ON DELETE CASCADE,
      creative_content TEXT,
      from_lines TEXT[],
      subject_lines TEXT[],
      creative_type VARCHAR(255),
      offer_category VARCHAR(255),
      approval_status VARCHAR(50),
      admin_feedback TEXT,
      client_feedback TEXT,
      performance_score FLOAT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // System audit log
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      action VARCHAR(255) NOT NULL,
      resource_type VARCHAR(255),
      resource_id VARCHAR(255),
      old_values JSONB,
      new_values JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create indexes for performance
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_publisher_requests_status ON publisher_requests(status);
    CREATE INDEX IF NOT EXISTS idx_publisher_requests_created_at ON publisher_requests(created_at);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
  `);

  console.log('✅ All database tables and indexes created successfully');
}
