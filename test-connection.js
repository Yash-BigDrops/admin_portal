const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

async function testConnection() {
  console.log('🔄 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully!');
    console.log('Time:', result.rows[0].current_time);
    console.log('PostgreSQL:', result.rows[0].pg_version.split(' ')[0]);
    
    // Test if our tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'user_sessions', 'publisher_requests')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables found:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Test if super admin exists
    const admin = await pool.query('SELECT email, first_name, last_name, role FROM users WHERE role = $1', ['super_admin']);
    if (admin.rows.length > 0) {
      console.log('\n👤 Super Admin User:');
      console.log(`  Email: ${admin.rows[0].email}`);
      console.log(`  Name: ${admin.rows[0].first_name} ${admin.rows[0].last_name}`);
      console.log(`  Role: ${admin.rows[0].role}`);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
