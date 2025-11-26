// Direct test of Everflow sync - bypasses auth
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

const EVERFLOW_API_BASE = process.env.EVERFLOW_API_URL || 'https://api.eflow.team/v1';
const API_KEY = process.env.EVERFLOW_API_KEY?.replace(/^["']|["']$/g, '');
const DATABASE_URL = process.env.DATABASE_URL;

console.log('=== Everflow Sync Diagnostic Test ===\n');
console.log('Environment Check:');
console.log('  EVERFLOW_API_URL:', EVERFLOW_API_BASE);
console.log('  EVERFLOW_API_KEY:', API_KEY ? API_KEY.substring(0, 10) + '...' : '❌ MISSING');
console.log('  DATABASE_URL:', DATABASE_URL ? '✅ Set' : '❌ MISSING');
console.log('');

if (!API_KEY) {
  console.error('❌ EVERFLOW_API_KEY is missing!');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing!');
  process.exit(1);
}

async function testEverflowAPI() {
  console.log('1. Testing Everflow API...');
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Eflow-API-Key': API_KEY,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    const url = `${EVERFLOW_API_BASE}/networks/offers?page=1&page_size=10`;
    console.log('   Fetching:', url);
    
    const r = await fetch(url, { method: 'GET', headers });
    
    console.log('   Status:', r.status, r.statusText);
    
    if (!r.ok) {
      const text = await r.text();
      console.error('   ❌ Error response:', text.substring(0, 500));
      return null;
    }

    const json = await r.json();
    const offers = json.offers || json.data || [];
    
    console.log('   ✅ Success!');
    console.log('   Total offers (paging):', json.paging?.total_count || 'N/A');
    console.log('   Offers in response:', offers.length);
    
    if (offers.length > 0) {
      const first = offers[0];
      console.log('\n   Sample offer:');
      console.log('     ID:', first.network_offer_id || first.offer_id || first.id);
      console.log('     Name:', first.name);
      console.log('     Status:', first.offer_status || first.status);
      console.log('     Keys:', Object.keys(first).slice(0, 10).join(', '));
    }
    
    return offers;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    console.error('   Stack:', error.stack);
    return null;
  }
}

async function testDatabase() {
  console.log('\n2. Testing Database Connection...');
  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    
    // Check if offers table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'offers'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('   ❌ Offers table does not exist!');
      await pool.end();
      return false;
    }
    
    console.log('   ✅ Offers table exists');
    
    // Check current count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM offers');
    console.log('   Current offers in DB:', countResult.rows[0].count);
    
    await pool.end();
    return true;
  } catch (error) {
    console.error('   ❌ Database error:', error.message);
    return false;
  }
}

async function testSync() {
  console.log('\n3. Testing Full Sync...');
  
  const offers = await testEverflowAPI();
  if (!offers || offers.length === 0) {
    console.log('   ⚠️  No offers to sync');
    return;
  }
  
  const dbOk = await testDatabase();
  if (!dbOk) {
    console.log('   ⚠️  Database issue - skipping sync');
    return;
  }
  
  // Simulate the sync logic
  console.log('\n4. Simulating sync insert...');
  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    
    // Process first offer as test
    const testOffer = offers[0];
    const offerId = String(testOffer.network_offer_id ?? testOffer.offer_id ?? testOffer.id);
    const name = testOffer.name;
    const status = testOffer.offer_status ?? testOffer.status;
    
    if (!name || !status) {
      console.log('   ⚠️  Test offer missing name or status');
      await pool.end();
      return;
    }
    
    // Extract payout
    let payout = null;
    if (testOffer.relationship?.payout_revenue?.entries?.length > 0) {
      const payoutEntry = testOffer.relationship.payout_revenue.entries[0];
      payout = payoutEntry.payout ?? payoutEntry.revenue_payout ?? payoutEntry.default_payout ?? null;
    }
    
    const currency = testOffer.currency_id ?? testOffer.currency ?? null;
    
    console.log('   Inserting test offer:');
    console.log('     ID:', offerId);
    console.log('     Name:', name);
    console.log('     Status:', status);
    console.log('     Payout:', payout);
    console.log('     Currency:', currency);
    
    await pool.query(
      `INSERT INTO offers (
        everflow_offer_id,
        name,
        status,
        payout,
        currency,
        data
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (everflow_offer_id) DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        payout = EXCLUDED.payout,
        currency = EXCLUDED.currency,
        data = EXCLUDED.data,
        updated_at = now()`,
      [
        offerId,
        name,
        status,
        payout,
        currency,
        JSON.stringify(testOffer),
      ]
    );
    
    console.log('   ✅ Test offer inserted successfully!');
    
    // Verify
    const verify = await pool.query(
      'SELECT * FROM offers WHERE everflow_offer_id = $1',
      [offerId]
    );
    console.log('   Verified:', verify.rows.length, 'row(s)');
    
    await pool.end();
  } catch (error) {
    console.error('   ❌ Sync error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

async function main() {
  await testSync();
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);

