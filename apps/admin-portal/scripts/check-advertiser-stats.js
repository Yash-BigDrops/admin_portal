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

console.log('📊 Checking advertiser_name statistics...\n')

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

async function checkStats() {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)                           AS total,
        COUNT(advertiser_name)             AS with_name,
        COUNT(*) - COUNT(advertiser_name)  AS without_name
      FROM offers;
    `)

    const stats = result.rows[0]
    console.log('📈 Advertiser Name Statistics:')
    console.log(`   Total offers: ${stats.total}`)
    console.log(`   With advertiser_name: ${stats.with_name}`)
    console.log(`   Without advertiser_name: ${stats.without_name}`)
    console.log()

    if (parseInt(stats.with_name) > 0) {
      console.log('✅ SUCCESS: Advertiser names are being saved!')
      console.log()

      // Show sample
      const sample = await pool.query(`
        SELECT everflow_offer_id, advertiser_id, advertiser_name
        FROM offers
        WHERE advertiser_name IS NOT NULL
        LIMIT 5
      `)

      console.log('📋 Sample offers with advertiser names:')
      sample.rows.forEach((r, i) => {
        console.log(
          `   ${i + 1}. Offer ${r.everflow_offer_id} - Advertiser: ${r.advertiser_name} (ID: ${r.advertiser_id})`,
        )
      })
    } else {
      console.log('⚠️  WARNING: No advertiser names found in database')
      console.log('   → Run a fresh sync from Everflow')
      console.log('   → Or check /api/everflow/advertisers endpoint')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await pool.end()
  }
}

checkStats()

