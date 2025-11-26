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
const apiKey = process.env.EVERFLOW_API_KEY
const apiBase = process.env.EVERFLOW_API_URL || 'https://api.eflow.team/v1'

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

if (!apiKey) {
  console.error('❌ EVERFLOW_API_KEY not found in .env.local')
  process.exit(1)
}

console.log('📊 Fetching advertiser names from Everflow API and backfilling...\n')

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

async function fetchAdvertisers() {
  try {
    console.log('1️⃣ Fetching advertisers from Everflow API (with pagination)...')
    
    const advertiserMap = {}
    let page = 1
    const pageSize = 100
    
    while (true) {
      const res = await fetch(
        `${apiBase}/networks/advertisers?page=${page}&page_size=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Eflow-API-Key': apiKey,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
          },
        },
      )

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        if (page === 1) {
          throw new Error(
            `Everflow API error ${res.status}: ${errorText.substring(0, 200)}`,
          )
        }
        break
      }

      const json = await res.json()
      
      if (page === 1) {
        console.log('   Response keys:', Object.keys(json))
      }

      // Handle different response structures
      let arr = []
      if (Array.isArray(json)) {
        arr = json
      } else if (Array.isArray(json.advertisers)) {
        arr = json.advertisers
      } else if (json.data && Array.isArray(json.data.advertisers)) {
        arr = json.data.advertisers
      } else if (json.data && Array.isArray(json.data)) {
        arr = json.data
      }

      if (!Array.isArray(arr) || arr.length === 0) {
        break
      }

      // Build advertiser map from this page
      for (const adv of arr) {
        const rawId =
          adv.network_advertiser_id ?? adv.advertiser_id ?? adv.id
        const name = adv.name ?? adv.company ?? adv.advertiser_name ?? null

        if (!rawId || !name) continue

        const id = String(rawId)
        advertiserMap[id] = name

        // Also map numeric version for "2" vs 2 matching
        if (!isNaN(Number(id))) {
          advertiserMap[Number(id)] = name
        }
      }

      console.log(`   Page ${page}: Fetched ${arr.length} advertisers (total: ${Object.keys(advertiserMap).length})`)

      // Check if there are more pages
      if (arr.length < pageSize) {
        break
      }
      page++
    }

    console.log(`   ✅ Total: ${Object.keys(advertiserMap).length} advertisers`)
    console.log()

    console.log('2️⃣ Sample advertisers:')
    const sampleIds = Object.keys(advertiserMap)
      .filter((k) => !isNaN(Number(k)))
      .slice(0, 5)
    sampleIds.forEach((id) => {
      console.log(`   ID ${id}: ${advertiserMap[id]}`)
    })
    console.log()

    return advertiserMap
  } catch (error) {
    console.error('❌ Error fetching advertisers:', error.message)
    throw error
  }
}

async function backfillNames(advertiserMap) {
  try {
    console.log('3️⃣ Updating offers with advertiser names...')

    // Get all offers with advertiser_id but no advertiser_name
    const offers = await pool.query(`
      SELECT everflow_offer_id, advertiser_id
      FROM offers
      WHERE advertiser_id IS NOT NULL AND advertiser_name IS NULL;
    `)

    console.log(`   Found ${offers.rows.length} offers needing advertiser names`)
    console.log()

    let updated = 0
    let notFound = 0

    for (const offer of offers.rows) {
      const advertiserId = offer.advertiser_id
      const advertiserName =
        advertiserMap[advertiserId] ||
        advertiserMap[String(advertiserId)] ||
        advertiserMap[Number(advertiserId)] ||
        null

      if (advertiserName) {
        await pool.query(
          `UPDATE offers SET advertiser_name = $1 WHERE everflow_offer_id = $2`,
          [advertiserName, offer.everflow_offer_id],
        )
        updated++
      } else {
        notFound++
        if (notFound <= 5) {
          console.log(
            `   ⚠️  Advertiser ID ${advertiserId} not found in Everflow response`,
          )
        }
      }
    }

    console.log(`   ✅ Updated ${updated} offers with advertiser names`)
    if (notFound > 0) {
      console.log(`   ⚠️  ${notFound} advertiser IDs not found in Everflow response`)
    }
    console.log()

    return { updated, notFound }
  } catch (error) {
    console.error('❌ Error backfilling names:', error.message)
    throw error
  }
}

async function verify() {
  try {
    console.log('4️⃣ Verifying results...')
    const stats = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(advertiser_id) AS with_adv_id,
        COUNT(advertiser_name) AS with_adv_name,
        COUNT(*) - COUNT(advertiser_name) AS without_adv_name
      FROM offers;
    `)

    console.log('   Total offers:', stats.rows[0].total)
    console.log('   With advertiser_id:', stats.rows[0].with_adv_id)
    console.log('   With advertiser_name:', stats.rows[0].with_adv_name)
    console.log('   Without advertiser_name:', stats.rows[0].without_adv_name)
    console.log()

    if (parseInt(stats.rows[0].with_adv_name) > 0) {
      console.log('5️⃣ Sample offers with advertiser names:')
      const sample = await pool.query(`
        SELECT everflow_offer_id, advertiser_id, advertiser_name
        FROM offers
        WHERE advertiser_name IS NOT NULL
        LIMIT 5;
      `)
      sample.rows.forEach((r, i) => {
        console.log(
          `   ${i + 1}. Offer ${r.everflow_offer_id} - Advertiser: ${r.advertiser_name} (ID: ${r.advertiser_id})`,
        )
      })
      console.log()
      console.log('✅ SUCCESS! Advertiser names are now populated!')
      console.log('   Refresh your /offers page to see the names in the UI.')
    } else {
      console.log('⚠️  WARNING: No advertiser names were populated')
    }
  } catch (error) {
    console.error('❌ Error verifying:', error.message)
  }
}

async function main() {
  try {
    const advertiserMap = await fetchAdvertisers()
    await backfillNames(advertiserMap)
    await verify()
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()

