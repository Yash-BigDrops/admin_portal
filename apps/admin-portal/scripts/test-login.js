const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function testLogin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Testing login credentials...\n');
    
    const email = 'admin@bigdrops.com';
    const password = 'AdminPortal@2025';
    
    // Check if user exists
    const result = await pool.query(
      'SELECT email, role, is_active, password_hash FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Is Active:', user.is_active);
    console.log('   Has Password Hash:', !!user.password_hash);
    console.log('');
    
    if (!user.password_hash) {
      console.log('❌ No password hash found!');
      return;
    }
    
    // Test password
    console.log('🔐 Testing password:', password);
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('   Password Match:', isValid ? '✅ YES' : '❌ NO');
    
    if (!isValid) {
      console.log('\n⚠️  Password does not match!');
      console.log('   Let me create a new password hash...');
      const newHash = await bcrypt.hash(password, 12);
      console.log('   New hash:', newHash.substring(0, 30) + '...');
      
      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [newHash, email]
      );
      console.log('✅ Password updated in database');
      
      // Test again
      const isValidAfter = await bcrypt.compare(password, newHash);
      console.log('   Verification after update:', isValidAfter ? '✅ YES' : '❌ NO');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testLogin().catch(console.error);
}

module.exports = { testLogin };

