const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        process.env[key] = value
      }
    }
  })
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

async function inspect() {
  try {
    // Get a few sample offers with their full JSON data
    const result = await pool.query(`
      SELECT everflow_offer_id, advertiser_id, data
      FROM offers
      WHERE advertiser_id IS NOT NULL
      LIMIT 3;
    `)
    
    console.log('📋 Inspecting offer JSON data structure:\n')
    
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. Offer ${row.everflow_offer_id} (advertiser_id: ${row.advertiser_id}):`)
      console.log('   JSON keys:', Object.keys(row.data || {}).slice(0, 20).join(', '))
      
      // Check for advertiser-related fields
      const data = row.data || {}
      const advertiserFields = Object.keys(data).filter(k => 
        k.toLowerCase().includes('advertiser') || 
        k.toLowerCase().includes('adv')
      )
      
      if (advertiserFields.length > 0) {
        console.log('   Advertiser-related fields:', advertiserFields.join(', '))
        advertiserFields.forEach(field => {
          console.log(`      ${field}: ${data[field] || '(null)'}`)
        })
      } else {
        console.log('   ⚠️  No advertiser-related fields found in JSON')
      }
      
      // Show full JSON structure (first 500 chars)
      console.log('   Full JSON preview:', JSON.stringify(data).substring(0, 500))
      console.log()
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

inspect()

