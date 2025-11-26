const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const dbUrl = process.env.DATABASE_URL_MAIN || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL_MAIN or DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('📊 Setting up publisher_applications table...\n');
console.log('   Database:', dbUrl.includes('@') ? dbUrl.split('@')[1] : 'Connected');
console.log('   URL:', dbUrl.substring(0, 50) + '...\n');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function setup() {
  try {
    // Read the schema SQL
    const schemaPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'packages',
      'database',
      'schema.sql'
    );

    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      process.exit(1);
    }

    const fullSchema = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract only the publisher_applications related SQL
    const publisherApplicationsSQL = `
-- Publisher applications
CREATE TABLE IF NOT EXISTS publisher_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  config_version INTEGER,
  payload JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publisher_applications_status_created
  ON publisher_applications (status, created_at DESC);

ALTER TABLE publisher_applications
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

ALTER TABLE publisher_applications
  ADD COLUMN IF NOT EXISTS publisher_id UUID;

CREATE INDEX IF NOT EXISTS idx_publisher_applications_publisher_id
  ON publisher_applications (publisher_id);
`;

    // Execute the SQL
    await pool.query(publisherApplicationsSQL);

    console.log('✅ publisher_applications table created successfully');
    console.log('✅ Indexes created successfully');
    console.log('✅ Columns added successfully\n');

    // Verify
    const { rows } = await pool.query(`
      SELECT COUNT(*) as count
      FROM publisher_applications
    `);

    console.log(`✅ Verified: ${rows[0].count} applications in table`);
    
    // Check columns
    const columnCheck = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'publisher_applications'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Table columns:');
    columnCheck.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('   (Table/column already exists, that\'s okay)');
    } else {
      console.error('Full error:', error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

setup();

