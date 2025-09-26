const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Use the same connection string as our app
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_9buHLit1sOFn@ep-floral-wildflower-ad7xxgq1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkPassword() {
  try {
    console.log('🔄 Checking super admin password...');
    
    // Get the super admin user
    const result = await pool.query('SELECT email, password_hash FROM users WHERE role = $1', ['super_admin']);
    
    if (result.rows.length === 0) {
      console.log('❌ Super admin not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Super admin found:', user.email);
    console.log('Password hash:', user.password_hash);
    
    // Test password verification
    const testPassword = 'AdminPortal@2025';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    
    console.log('Password verification result:', isValid ? '✅ VALID' : '❌ INVALID');
    
    // If invalid, let's create a new hash
    if (!isValid) {
      console.log('🔄 Creating new password hash...');
      const newHash = await bcrypt.hash(testPassword, 12);
      
      // Update the password in database
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, user.email]);
      console.log('✅ Password updated in database');
      
      // Verify the new password
      const newIsValid = await bcrypt.compare(testPassword, newHash);
      console.log('New password verification result:', newIsValid ? '✅ VALID' : '❌ INVALID');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPassword();
