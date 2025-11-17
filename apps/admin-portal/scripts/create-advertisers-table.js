const { Pool } = require('pg');
require('dotenv').config({ path: './.env.local' });

async function createAdvertisersTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Creating advertisers table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS advertisers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        advertiser_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        email VARCHAR(255),
        website VARCHAR(255),
        adv_platform VARCHAR(100) NOT NULL,
        platform_id VARCHAR(255),
        api_adv_id VARCHAR(255),
        created_via VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (created_via IN ('manual', 'api')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(api_adv_id, adv_platform)
      );

      CREATE INDEX IF NOT EXISTS idx_advertisers_status ON advertisers(status);
      CREATE INDEX IF NOT EXISTS idx_advertisers_platform ON advertisers(adv_platform);
      CREATE INDEX IF NOT EXISTS idx_advertisers_created_via ON advertisers(created_via);
      CREATE INDEX IF NOT EXISTS idx_advertisers_created_at ON advertisers(created_at);

      CREATE OR REPLACE FUNCTION update_advertisers_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_advertisers_updated_at ON advertisers;
      CREATE TRIGGER update_advertisers_updated_at 
        BEFORE UPDATE ON advertisers
        FOR EACH ROW 
        EXECUTE FUNCTION update_advertisers_updated_at();
    `);
    console.log('✅ Advertisers table created successfully');
  } catch (error) {
    console.error('❌ Error creating advertisers table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createAdvertisersTable()
  .then(() => console.log('🎉 Advertisers table setup completed!'))
  .catch(e => console.error('Advertisers table setup failed:', e));

