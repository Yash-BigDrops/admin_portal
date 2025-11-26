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

console.log('📊 Adding advertiser columns to offers table...');
console.log('   Database:', dbUrl.substring(0, 60) + '...');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function addColumns() {
  try {
    await pool.query(`
      ALTER TABLE offers 
      ADD COLUMN IF NOT EXISTS advertiser_id TEXT,
      ADD COLUMN IF NOT EXISTS advertiser_name TEXT;
    `);
    console.log('✅ Columns added successfully');
    
    // Verify
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'offers' 
      AND column_name IN ('advertiser_id', 'advertiser_name');
    `);
    
    console.log('\n✅ Verified columns:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

addColumns();

