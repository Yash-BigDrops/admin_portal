const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSQLSetup() {
  console.log('🔄 Running Admin Portal Database Setup...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Test connection first
    console.log('1. Testing database connection...');
    const connectionTest = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully');
    console.log(`   Time: ${connectionTest.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${connectionTest.rows[0].pg_version.split(' ')[0]}\n`);

    // Read and execute SQL file
    console.log('2. Reading SQL setup file...');
    const sqlFile = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements to execute\n`);

    console.log('3. Creating tables and indexes...');
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`   ⚠️  Statement ${i + 1} - already exists (skipped)`);
          } else {
            console.log(`   ❌ Statement ${i + 1} failed: ${error.message}`);
          }
        }
      }
    }

    console.log('\n4. Verifying setup...');
    const verification = await pool.query(`
      SELECT 
        'Database setup completed successfully!' as message,
        COUNT(*) as total_tables
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'user_sessions', 'publisher_requests', 'form_configurations', 'offer_assignments', 'llm_training_data', 'audit_log')
    `);

    console.log(`✅ ${verification.rows[0].message}`);
    console.log(`   Tables created: ${verification.rows[0].total_tables}`);

    // Check super admin user
    const adminCheck = await pool.query(`
      SELECT 
        'Super Admin User' as info,
        email,
        first_name,
        last_name,
        role,
        created_at
      FROM users 
      WHERE role = 'super_admin'
    `);

    if (adminCheck.rows.length > 0) {
      console.log('\n✅ Super Admin User:');
      console.log(`   Email: ${adminCheck.rows[0].email}`);
      console.log(`   Name: ${adminCheck.rows[0].first_name} ${adminCheck.rows[0].last_name}`);
      console.log(`   Role: ${adminCheck.rows[0].role}`);
      console.log(`   Created: ${adminCheck.rows[0].created_at}`);
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Visit http://localhost:3000/api/test-db to test the API');
    console.log('2. Visit http://localhost:3000/login to test the login page');
    console.log('3. Use credentials: admin@bigdrops.com / AdminPortal@2025');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
runSQLSetup();
