const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('📊 Checking offers table schema...');
console.log('   Database:', dbUrl.substring(0, 60) + '...');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function checkSchema() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'offers'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Offers table does not exist!');
      await pool.end();
      return;
    }
    
    console.log('✅ Offers table exists');
    
    // Get columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'offers' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Columns in offers table:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check for required columns
    const requiredColumns = ['everflow_offer_id', 'name', 'status', 'visibility', 'payout', 'currency', 'geo_targets', 'data'];
    const existingColumns = columns.rows.map(r => r.column_name);
    const missing = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missing.length > 0) {
      console.log('\n❌ Missing required columns:');
      missing.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('\n✅ All required columns exist');
    }
    
    // Check row count
    const count = await pool.query('SELECT COUNT(*) as count FROM offers');
    console.log(`\n📊 Current offers count: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkSchema();

