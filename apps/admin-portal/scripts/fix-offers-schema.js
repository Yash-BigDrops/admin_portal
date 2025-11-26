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

console.log('🔧 Fixing offers table schema...');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function fixSchema() {
  try {
    // Enable pgcrypto extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    console.log('✅ pgcrypto extension enabled');

    // Drop the old table if it exists with wrong schema
    await pool.query('DROP TABLE IF EXISTS offers CASCADE;');
    console.log('✅ Dropped old offers table');

    // Create the correct table
    await pool.query(`
      CREATE TABLE offers (
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
      );
    `);
    console.log('✅ Created offers table with correct schema');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_visibility ON offers (visibility);
      CREATE INDEX IF NOT EXISTS idx_offers_everflow_offer_id ON offers (everflow_offer_id);
    `);
    console.log('✅ Created indexes');

    // Verify
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'offers' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n✅ Verified schema:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}`);
    });

    console.log('\n✅ Schema fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

fixSchema();

