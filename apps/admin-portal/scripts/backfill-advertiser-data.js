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

console.log('📊 Backfilling advertiser data from JSON column...\n')

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

async function backfill() {
  try {
    // Step 1: Check current status
    console.log('1️⃣ Checking current offers status...')
    const stats1 = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status <> 'active') AS not_active
      FROM offers;
    `)
    console.log('   Total:', stats1.rows[0].total)
    console.log('   Active:', stats1.rows[0].active)
    console.log('   Not Active:', stats1.rows[0].not_active)
    console.log()

    // Step 2: Delete non-active offers
    if (parseInt(stats1.rows[0].not_active) > 0) {
      console.log('2️⃣ Deleting non-active offers...')
      const deleteResult = await pool.query(`
        DELETE FROM offers WHERE status <> 'active';
      `)
      console.log(`   ✅ Deleted ${stats1.rows[0].not_active} non-active offers`)
      console.log()
    } else {
      console.log('2️⃣ No non-active offers to delete')
      console.log()
    }

    // Step 3: Check sample data structure
    console.log('3️⃣ Checking sample data structure...')
    const sample = await pool.query(`
      SELECT everflow_offer_id, 
             data->>'advertiserId' as adv_id_camel,
             data->>'network_advertiser_id' as n_adv_id, 
             data->>'advertiser_id' as adv_id,
             data->>'advertiserName' as adv_name_camel,
             data->>'network_advertiser_name' as n_adv_name,
             data->>'advertiser_name' as adv_name
      FROM offers 
      LIMIT 3;
    `)
    console.log('   Sample data keys:')
    sample.rows.forEach((r, i) => {
      console.log(`   ${i + 1}. Offer ${r.everflow_offer_id}:`)
      console.log(`      advertiserId (camelCase): ${r.adv_id_camel || '(null)'}`)
      console.log(`      network_advertiser_id: ${r.n_adv_id || '(null)'}`)
      console.log(`      advertiser_id: ${r.adv_id || '(null)'}`)
      console.log(`      advertiserName (camelCase): ${r.adv_name_camel || '(null)'}`)
      console.log(`      network_advertiser_name: ${r.n_adv_name || '(null)'}`)
      console.log(`      advertiser_name: ${r.adv_name || '(null)'}`)
    })
    console.log()

    // Step 4: Backfill advertiser_id and advertiser_name from JSON
    // Note: JSON uses camelCase (advertiserId, advertiserName), not snake_case
    console.log('4️⃣ Backfilling advertiser_id and advertiser_name from JSON...')
    const updateResult = await pool.query(`
      UPDATE offers
      SET
        advertiser_id = COALESCE(
          advertiser_id,
          data->>'advertiserId',
          data->>'network_advertiser_id',
          data->>'advertiser_id'
        ),
        advertiser_name = COALESCE(
          advertiser_name,
          data->>'advertiserName',
          data->>'network_advertiser_name',
          data->>'advertiser_name'
        )
      WHERE
        advertiser_id IS DISTINCT FROM COALESCE(
          data->>'advertiserId',
          data->>'network_advertiser_id',
          data->>'advertiser_id'
        )
        OR advertiser_name IS DISTINCT FROM COALESCE(
          data->>'advertiserName',
          data->>'network_advertiser_name',
          data->>'advertiser_name'
        );
    `)
    console.log(`   ✅ Updated ${updateResult.rowCount} offers`)
    console.log()

    // Step 5: Verify results
    console.log('5️⃣ Verifying results...')
    const stats2 = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(advertiser_id) AS with_adv_id,
        COUNT(advertiser_name) AS with_adv_name,
        COUNT(*) - COUNT(advertiser_name) AS without_adv_name
      FROM offers;
    `)
    console.log('   Total offers:', stats2.rows[0].total)
    console.log('   With advertiser_id:', stats2.rows[0].with_adv_id)
    console.log('   With advertiser_name:', stats2.rows[0].with_adv_name)
    console.log('   Without advertiser_name:', stats2.rows[0].without_adv_name)
    console.log()

    // Step 6: Show sample with names
    if (parseInt(stats2.rows[0].with_adv_name) > 0) {
      console.log('6️⃣ Sample offers with advertiser names:')
      const sampleWithNames = await pool.query(`
        SELECT everflow_offer_id, advertiser_id, advertiser_name
        FROM offers
        WHERE advertiser_name IS NOT NULL
        LIMIT 5;
      `)
      sampleWithNames.rows.forEach((r, i) => {
        console.log(
          `   ${i + 1}. Offer ${r.everflow_offer_id} - Advertiser: ${r.advertiser_name} (ID: ${r.advertiser_id})`,
        )
      })
      console.log()
      console.log('✅ SUCCESS! Advertiser names are now populated!')
      console.log('   Refresh your /offers page to see the names in the UI.')
    } else {
      console.log('⚠️  WARNING: No advertiser names found in JSON data column')
      console.log('   The data column may not contain network_advertiser_name or advertiser_name fields')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await pool.end()
  }
}

backfill()

