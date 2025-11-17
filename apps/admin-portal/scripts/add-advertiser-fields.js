const { Pool } = require('pg');
require('dotenv').config({ path: './.env.local' });

async function addAdvertiserFields() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(' Adding new fields to advertisers table...');
    await pool.query(`
      ALTER TABLE advertisers
      ADD COLUMN IF NOT EXISTS platform_affiliate_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS api_key VARCHAR(500),
      ADD COLUMN IF NOT EXISTS platform_url VARCHAR(500);
    `);
    console.log(' New fields added successfully');
  } catch (error) {
    console.error(' Error adding fields:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addAdvertiserFields()
  .then(() => console.log(' Advertiser fields addition completed!'))
  .catch(e => console.error('Fields addition failed:', e));

