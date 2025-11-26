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

console.log('📊 Checking advertiser data in offers table...\n');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function checkData() {
  try {
    // Get stats
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(advertiser_id) as with_id,
        COUNT(advertiser_name) as with_name,
        COUNT(CASE WHEN advertiser_id IS NOT NULL AND advertiser_name IS NULL THEN 1 END) as missing_names
      FROM offers
    `);
    
    console.log('📈 Statistics:');
    console.log(JSON.stringify(stats.rows[0], null, 2));
    console.log();
    
    // Sample offers with advertiser data
    const withAdvertiser = await pool.query(`
      SELECT everflow_offer_id, name, advertiser_id, advertiser_name 
      FROM offers 
      WHERE advertiser_id IS NOT NULL 
      LIMIT 10
    `);
    
    console.log('✅ Sample offers with advertiser data:');
    withAdvertiser.rows.forEach((r, i) => {
      console.log(`${i + 1}. Offer ${r.everflow_offer_id}:`);
      console.log(`   Name: ${r.name.substring(0, 50)}...`);
      console.log(`   Advertiser ID: ${r.advertiser_id}`);
      console.log(`   Advertiser Name: ${r.advertiser_name || '(null)'}`);
      console.log();
    });
    
    // Offers missing advertiser names
    const missingNames = await pool.query(`
      SELECT everflow_offer_id, advertiser_id 
      FROM offers 
      WHERE advertiser_id IS NOT NULL AND advertiser_name IS NULL 
      LIMIT 5
    `);
    
    if (missingNames.rows.length > 0) {
      console.log('⚠️  Offers with advertiser_id but missing advertiser_name:');
      missingNames.rows.forEach((r, i) => {
        console.log(`   ${i + 1}. Offer ${r.everflow_offer_id} - Advertiser ID: ${r.advertiser_id}`);
      });
    } else {
      console.log('✅ All offers with advertiser_id have advertiser_name!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkData();

