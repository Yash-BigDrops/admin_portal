import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

// Publisher database connection (you'll need to add this to your environment variables)
const PUBLISHER_DB_URL = process.env.PUBLISHER_DATABASE_URL;

export async function POST() {
  try {
    if (!PUBLISHER_DB_URL) {
      return NextResponse.json({
        success: false,
        error: 'Publisher database URL not configured',
        message: 'Please set PUBLISHER_DATABASE_URL environment variable'
      }, { status: 400 });
    }

    // Connect to publisher database
    const { Pool } = require('pg');
    const publisherPool = new Pool({
      connectionString: PUBLISHER_DB_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const adminPool = getPool();
    
    const publisherClient = await publisherPool.connect();
    const adminClient = await adminPool.connect();
    
    try {
      await adminClient.query('BEGIN');
      
      // Get all publisher submissions from the publisher database
      const publisherData = await publisherClient.query(`
        SELECT 
          id,
          company_name,
          first_name,
          last_name,
          email,
          telegram_id,
          offer_id,
          creative_type,
          priority,
          status,
          additional_notes,
          created_at,
          updated_at
        FROM publisher_submissions 
        ORDER BY created_at DESC
      `);
      
      console.log(`Found ${publisherData.rows.length} publisher submissions to migrate`);
      
      let migratedCount = 0;
      let skippedCount = 0;
      
      for (const submission of publisherData.rows) {
        try {
          // Check if this submission already exists in admin database
          const existingCheck = await adminClient.query(
            'SELECT id FROM publisher_requests WHERE id = $1',
            [submission.id]
          );
          
          if (existingCheck.rows.length > 0) {
            skippedCount++;
            continue;
          }
          
          // Prepare submitted_data JSON
          const submittedData = {
            company_name: submission.company_name,
            first_name: submission.first_name,
            last_name: submission.last_name,
            email: submission.email,
            telegram_id: submission.telegram_id,
            offer_id: submission.offer_id,
            creative_type: submission.creative_type,
            priority: submission.priority,
            additional_notes: submission.additional_notes,
            original_id: submission.id,
            migrated_at: new Date().toISOString()
          };
          
          // Insert into admin database
          await adminClient.query(`
            INSERT INTO publisher_requests (
              id,
              publisher_name,
              email,
              company_name,
              telegram_id,
              offer_id,
              creative_type,
              priority,
              status,
              submitted_data,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            submission.id,
            `${submission.first_name} ${submission.last_name}`,
            submission.email,
            submission.company_name,
            submission.telegram_id,
            submission.offer_id,
            submission.creative_type,
            submission.priority || 'medium',
            submission.status || 'pending',
            JSON.stringify(submittedData),
            submission.created_at,
            submission.updated_at
          ]);
          
          migratedCount++;
          
        } catch (error) {
          console.error(`Error migrating submission ${submission.id}:`, error);
          // Continue with next submission
        }
      }
      
      await adminClient.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: 'Publisher data migration completed',
        stats: {
          total_found: publisherData.rows.length,
          migrated: migratedCount,
          skipped: skippedCount
        }
      });
      
    } catch (error) {
      await adminClient.query('ROLLBACK');
      throw error;
    } finally {
      publisherClient.release();
      adminClient.release();
      await publisherPool.end();
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to migrate publisher data'
      },
      { status: 500 }
    );
  }
}
