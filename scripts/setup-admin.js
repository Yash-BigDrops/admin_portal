const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function setupSuperAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check if super admin exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE role = $1',
      ['super_admin']
    );

    if (existing.rows.length > 0) {
      console.log('✅ Super admin already exists');
      return;
    }

    // Create super admin
    const email = 'admin@bigdrops.com';
    const password = 'AdminPortal@2025'; // Change this!
    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, passwordHash, 'Super', 'Admin', 'super_admin', true]
    );

    console.log('✅ Super admin created successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('🔐 Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
  } finally {
    await pool.end();
  }
}

setupSuperAdmin();
