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

async function setup() {
  try {
    console.log('📊 Setting up integration_credentials table...\n')

    const schemaPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'packages',
      'database',
      'credentials-schema.sql',
    )

    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath)
      process.exit(1)
    }

    const schema = fs.readFileSync(schemaPath, 'utf8')

    await pool.query(schema)

    console.log('✅ Table created successfully')

    // Verify
    const { rows } = await pool.query(`
      SELECT COUNT(*) as count
      FROM integration_credentials
    `)

    console.log(`✅ Verified: ${rows[0].count} credentials in table`)
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.message.includes('already exists')) {
      console.log('   (Table already exists, that\'s okay)')
    } else {
      process.exit(1)
    }
  } finally {
    await pool.end()
  }
}

setup()

