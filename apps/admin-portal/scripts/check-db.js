// Read .env.local manually
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

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
        // Remove quotes if present
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

console.log('📊 Connecting to database...');
console.log('   URL:', dbUrl.substring(0, 50) + '...');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function checkAndCreateTable() {
  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'offers'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Offers table already exists!');
      return;
    }

    console.log('❌ Offers table does not exist. Creating it...');

    // Create the table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        everflow_offer_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        visibility TEXT NOT NULL DEFAULT 'hidden',
        payout NUMERIC(12, 2),
        currency TEXT,
        geo_targets TEXT[],
        data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_visibility ON offers (visibility)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_everflow_offer_id ON offers (everflow_offer_id)
    `);

    console.log('✅ Offers table created successfully!');
    console.log('✅ Indexes created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message || error);
    console.error('Full error:', error);
    if (error.message && error.message.includes('pgcrypto')) {
      console.log('\n💡 You may need to enable the pgcrypto extension:');
      console.log('   Run: CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    }
  } finally {
    await pool.end();
  }
}

checkAndCreateTable();

