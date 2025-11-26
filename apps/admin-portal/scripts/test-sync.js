// Test the Everflow sync directly
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

console.log('Testing Everflow API...');
console.log('Base URL:', EVERFLOW_API_BASE);
console.log('API Key:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING');

async function testFetch() {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Eflow-API-Key': API_KEY,
    };

    console.log('\nFetching from:', `${EVERFLOW_API_BASE}/networks/offers`);
    
    const r = await fetch(`${EVERFLOW_API_BASE}/networks/offers`, {
      method: 'GET',
      headers,
    });

    console.log('Status:', r.status, r.statusText);

    if (!r.ok) {
      const text = await r.text();
      console.error('Error response:', text.substring(0, 500));
      return;
    }

    const json = await r.json();
    const offers = json.offers || json.data || [];
    
    console.log('\n✅ Success!');
    console.log('Total offers:', json.paging?.total_count || offers.length);
    console.log('First page offers:', offers.length);
    
    if (offers.length > 0) {
      const first = offers[0];
      console.log('\nSample offer:');
      console.log('  ID:', first.network_offer_id);
      console.log('  Name:', first.name);
      console.log('  Status:', first.offer_status);
      console.log('  Currency:', first.currency_id);
      
      // Check payout
      if (first.relationship?.payout_revenue?.entries?.length > 0) {
        console.log('  Payout:', first.relationship.payout_revenue.entries[0].payout);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFetch();

