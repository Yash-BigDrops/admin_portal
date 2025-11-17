const { Pool } = require('pg');

async function addPublisherRequestsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Creating publisher_requests table...');

    // Create publisher_requests table (same structure as requests but with specific name)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS publisher_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        publisher_name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        telegram_id VARCHAR(255),
        offer_id VARCHAR(255),
        creative_type VARCHAR(255),
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        submitted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        admin_notes TEXT,
        client_notes TEXT,
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP,
        rejected_by UUID REFERENCES users(id),
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_publisher_requests_status ON publisher_requests(status);
      CREATE INDEX IF NOT EXISTS idx_publisher_requests_created_at ON publisher_requests(created_at);
      CREATE INDEX IF NOT EXISTS idx_publisher_requests_email ON publisher_requests(email);
    `);

    // Create trigger for updated_at
    await pool.query(`
      CREATE TRIGGER update_publisher_requests_updated_at 
      BEFORE UPDATE ON publisher_requests
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ publisher_requests table created successfully');

  } catch (error) {
    console.error('❌ Error creating publisher_requests table:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  addPublisherRequestsTable().catch(console.error);
}

module.exports = { addPublisherRequestsTable };

