const { Pool } = require('pg');

// Manually set the environment variable
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_9buHLit1sOFn@ep-floral-wildflower-ad7xxgq1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function testDatabase() {
  console.log('🔄 Testing database connection with manual env var...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully!');
    console.log('Time:', result.rows[0].current_time);
    
    // Test if super admin exists
    const admin = await pool.query('SELECT email, first_name, last_name, role FROM users WHERE role = $1', ['super_admin']);
    if (admin.rows.length > 0) {
      console.log('✅ Super Admin found:', admin.rows[0].email);
    } else {
      console.log('❌ Super Admin not found');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();
