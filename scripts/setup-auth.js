const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function setupAuth() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL,
  });

  try {
    console.log('🔄 Setting up authentication and RBAC...');

    // Read and execute the auth schema
    const fs = require('fs');
    const authSchema = fs.readFileSync('./auth-schema.sql', 'utf8');
    
    await pool.query(authSchema);
    console.log('✅ Authentication schema created');

    // Create a test user with hashed password
    const hashedPassword = await bcrypt.hash('AdminPortal@2025', 12);
    
    await pool.query(`
      INSERT INTO users (email, password, name, first_name, last_name, role, is_active, email_verified) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET 
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        updated_at = NOW()
    `, [
      'admin@bigdrops.com',
      hashedPassword,
      'Super Admin',
      'Super',
      'Admin',
      'super_admin',
      true,
      new Date()
    ]);

    console.log('✅ Super admin user created/updated');
    console.log('📧 Email: admin@bigdrops.com');
    console.log('🔑 Password: AdminPortal@2025');

    console.log('🎉 Authentication setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  setupAuth().catch(console.error);
}

module.exports = { setupAuth };
