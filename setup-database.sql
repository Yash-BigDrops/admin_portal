-- Admin Portal Database Setup
-- This script creates all necessary tables and initial data

-- Users table (Admin, Super Admin, Client roles)
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

-- Sessions table for JWT token management
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

-- Publisher/Advertiser requests (from Publisher Portal)
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

-- Form configurations (dynamic form builder)
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

-- Offer assignments (which publishers can see which offers)
CREATE TABLE IF NOT EXISTS offer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_email VARCHAR(255) NOT NULL,
  offer_id VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(publisher_email, offer_id)
);

-- LLM training data collection
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

-- System audit log
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_publisher_requests_status ON publisher_requests(status);
CREATE INDEX IF NOT EXISTS idx_publisher_requests_created_at ON publisher_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Insert super admin user (password: AdminPortal@2025)
-- Note: This password hash is for 'AdminPortal@2025' with bcrypt rounds=12
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
VALUES (
  'admin@bigdrops.com', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzK4aO', 
  'Super', 
  'Admin', 
  'super_admin', 
  true
) ON CONFLICT (email) DO NOTHING;

-- Verify the setup
SELECT 
  'Database setup completed successfully!' as message,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'user_sessions', 'publisher_requests', 'form_configurations', 'offer_assignments', 'llm_training_data', 'audit_log');

-- Show super admin user
SELECT 
  'Super Admin User' as info,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM users 
WHERE role = 'super_admin';
