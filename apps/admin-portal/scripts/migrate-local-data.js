const { Client } = require('pg');
require('dotenv').config();

const migrateLocalData = async () => {
  // For testing, we'll create some sample historical data
  const sampleData = [
    {
      id: 'hist-001',
      publisher_name: 'Historical Publisher 1',
      email: 'hist1@example.com',
      company_name: 'Historical Company 1',
      telegram_id: '@hist1',
      offer_id: 'HIST_001',
      creative_type: 'Email',
      priority: 'high',
      status: 'pending',
      submitted_data: {
        affiliateId: 'HIST_AFF_001',
        companyName: 'Historical Company 1',
        firstName: 'Historical',
        lastName: 'Publisher 1',
        email: 'hist1@example.com',
        telegramId: '@hist1',
        offerId: 'HIST_001',
        creativeType: 'Email',
        priority: 'high',
        submissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'hist-002',
      publisher_name: 'Historical Publisher 2',
      email: 'hist2@example.com',
      company_name: 'Historical Company 2',
      telegram_id: '@hist2',
      offer_id: 'HIST_002',
      creative_type: 'SMS',
      priority: 'medium',
      status: 'admin_approved',
      submitted_data: {
        affiliateId: 'HIST_AFF_002',
        companyName: 'Historical Company 2',
        firstName: 'Historical',
        lastName: 'Publisher 2',
        email: 'hist2@example.com',
        telegramId: '@hist2',
        offerId: 'HIST_002',
        creativeType: 'SMS',
        priority: 'medium',
        submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    {
      id: 'hist-003',
      publisher_name: 'Historical Publisher 3',
      email: 'hist3@example.com',
      company_name: 'Historical Company 3',
      telegram_id: '@hist3',
      offer_id: 'HIST_003',
      creative_type: 'Push',
      priority: 'low',
      status: 'admin_rejected',
      submitted_data: {
        affiliateId: 'HIST_AFF_003',
        companyName: 'Historical Company 3',
        firstName: 'Historical',
        lastName: 'Publisher 3',
        email: 'hist3@example.com',
        telegramId: '@hist3',
        offerId: 'HIST_003',
        creativeType: 'Push',
        priority: 'low',
        submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  ];

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Starting local data migration...');
    
    await client.connect();
    console.log('✅ Connected to database');

    let migratedCount = 0;
    let skippedCount = 0;

    for (const row of sampleData) {
      try {
        const result = await client.query(
          `
          INSERT INTO publisher_requests (
            id, publisher_name, email, company_name, telegram_id, offer_id,
            creative_type, priority, status, submitted_data, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          ON CONFLICT (id) DO NOTHING
          RETURNING id;
        `,
          [
            row.id,
            row.publisher_name,
            row.email,
            row.company_name,
            row.telegram_id,
            row.offer_id,
            row.creative_type,
            row.priority,
            row.status,
            JSON.stringify(row.submitted_data),
            row.created_at,
            row.updated_at,
          ]
        );

        if (result.rows.length > 0) {
          console.log(`✅ Migrated: ${row.publisher_name} (${row.id})`);
          migratedCount++;
        } else {
          console.log(`⏭️  Skipped: ${row.publisher_name} (${row.id}) - already exists`);
          skippedCount++;
        }

      } catch (error) {
        console.error(`❌ Error migrating ${row.id}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total: ${sampleData.length}`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped: ${skippedCount}`);

    // Check final count
    const countResult = await client.query('SELECT COUNT(*) as count FROM publisher_requests');
    console.log(`\n📈 Total submissions in database: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
};

migrateLocalData();
