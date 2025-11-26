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

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function testUpdate() {
  try {
    // Test updating advertiser_name for one offer
    console.log('🧪 Testing advertiser_name update...\n');
    
    const result = await pool.query(`
      UPDATE offers 
      SET advertiser_name = 'Test Advertiser Name'
      WHERE everflow_offer_id = '1290'
      RETURNING everflow_offer_id, advertiser_id, advertiser_name;
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Update successful:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      
      // Verify it was saved
      const verify = await pool.query(`
        SELECT everflow_offer_id, advertiser_id, advertiser_name 
        FROM offers 
        WHERE everflow_offer_id = '1290'
      `);
      
      console.log('\n✅ Verification:');
      console.log(JSON.stringify(verify.rows[0], null, 2));
    } else {
      console.log('⚠️  No rows updated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testUpdate();

