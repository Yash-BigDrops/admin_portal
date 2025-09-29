const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function testDatabaseAndSetup() {
  console.log('🔄 Testing Admin Portal Database Setup...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Test basic connection
    console.log('1. Testing database connection...');
    const connectionTest = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully');
    console.log(`   Time: ${connectionTest.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${connectionTest.rows[0].pg_version.split(' ')[0]}\n`);

    // Test table creation
    console.log('2. Testing table creation...');
    
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
    console.log('✅ Users table created/verified');

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
    console.log('✅ User sessions table created/verified');

    // Check if super admin exists
    console.log('\n3. Checking for super admin user...');
    const existingAdmin = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE role = $1',
      ['super_admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✅ Super admin already exists');
      console.log(`   Email: ${existingAdmin.rows[0].email}`);
      console.log(`   Name: ${existingAdmin.rows[0].first_name} ${existingAdmin.rows[0].last_name}`);
    } else {
      console.log('4. Creating super admin user...');
      const email = 'admin@bigdrops.com';
      const password = 'AdminPortal@2025';
      const passwordHash = await bcrypt.hash(password, 12);

      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [email, passwordHash, 'Super', 'Admin', 'super_admin', true]
      );

      console.log('✅ Super admin created successfully');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log('   🔐 Please change the password after first login!');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Visit https://admin.cms.bigdropsmarketing.com/api/test-db to test the API');
    console.log('2. Visit https://admin.cms.bigdropsmarketing.com/login to test the login page');
    console.log('3. Use the super admin credentials to log in');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
testDatabaseAndSetup();
