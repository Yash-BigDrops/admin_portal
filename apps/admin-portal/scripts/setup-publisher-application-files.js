const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const dbUrl = process.env.DATABASE_URL_MAIN || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Error: DATABASE_URL_MAIN or DATABASE_URL must be set in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function setupTable() {
  try {
    console.log('Creating publisher_application_files table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS publisher_application_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID NOT NULL,
        storage_key TEXT NOT NULL,
        original_name TEXT NOT NULL,
        size_bytes BIGINT NOT NULL,
        mime_type TEXT NOT NULL,
        source TEXT NOT NULL,
        is_html BOOLEAN NOT NULL DEFAULT FALSE,
        is_image BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT fk_application_files_application
          FOREIGN KEY (application_id) REFERENCES publisher_applications(id)
          ON DELETE CASCADE
      );
    `);

    console.log('Creating index on publisher_application_files...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_publisher_application_files_app_id
        ON publisher_application_files (application_id);
    `);

    console.log('✅ publisher_application_files table and index created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

setupTable().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});

