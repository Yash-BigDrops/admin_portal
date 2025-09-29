import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST() {
  // Configure source (Publisher DB) and target (Admin DB) connection strings
  const sourceClient = new Client({
    connectionString: process.env.PUBLISHER_DB_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const targetClient = new Client({
    connectionString: process.env.ADMIN_DB_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Starting migration process...');
    
    await sourceClient.connect();
    console.log('✅ Connected to Publisher DB');
    
    await targetClient.connect();
    console.log('✅ Connected to Admin DB');

    // Fetch all publisher submissions from source
    console.log('📥 Fetching submissions from Publisher DB...');
    const res = await sourceClient.query(
      `SELECT * FROM publisher_requests ORDER BY created_at ASC`
    );

    console.log(`📊 Found ${res.rows.length} submissions to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const row of res.rows) {
      try {
        await targetClient.query(
          `
          INSERT INTO publisher_requests (
            id, publisher_name, email, company_name, telegram_id, offer_id,
            creative_type, priority, status, submitted_data, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          ON CONFLICT (id) DO NOTHING;
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
            row.status || 'pending',
            row.submitted_data || JSON.stringify(row),
            row.created_at,
            row.updated_at || row.created_at,
          ]
        );

        // Check if row was actually inserted
        const checkResult = await targetClient.query(
          'SELECT id FROM publisher_requests WHERE id = $1',
          [row.id]
        );

        if (checkResult.rows.length > 0) {
          migratedCount++;
        } else {
          skippedCount++;
        }

      } catch (error) {
        console.error(`❌ Error migrating submission ${row.id}:`, error);
        errorCount++;
      }
    }

    console.log('✅ Migration completed');
    console.log(`📈 Results: ${migratedCount} migrated, ${skippedCount} skipped, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully`,
      stats: {
        total: res.rows.length,
        migrated: migratedCount,
        skipped: skippedCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Migration failed'
      },
      { status: 500 }
    );
  } finally {
    try {
      await sourceClient.end();
      await targetClient.end();
      console.log('🔌 Database connections closed');
    } catch (error) {
      console.error('Error closing connections:', error);
    }
  }
}
