import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    // Try to connect to publisher database
    const PUBLISHER_DB_URL = process.env.PUBLISHER_DATABASE_URL;
    
    if (!PUBLISHER_DB_URL) {
      return NextResponse.json({
        success: false,
        error: 'Publisher database URL not configured',
        message: 'Please set PUBLISHER_DATABASE_URL environment variable'
      }, { status: 400 });
    }

    const publisherPool = new Pool({
      connectionString: PUBLISHER_DB_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await publisherPool.connect();
    
    try {
      // Test connection
      const connectionTest = await client.query('SELECT NOW() as current_time');
      
      // Get table list
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      // Try to get publisher submissions count
      let publisherSubmissionsCount = 0;
      let sampleData = [];
      
      try {
        const countResult = await client.query('SELECT COUNT(*) as count FROM publisher_submissions');
        publisherSubmissionsCount = parseInt(countResult.rows[0].count);
        
        // Get sample data
        const sampleResult = await client.query(`
          SELECT id, company_name, first_name, last_name, email, offer_id, created_at
          FROM publisher_submissions 
          ORDER BY created_at DESC 
          LIMIT 5
        `);
        sampleData = sampleResult.rows;
      } catch (error) {
        console.log('Publisher submissions table not found or error:', error instanceof Error ? error.message : 'Unknown error');
      }
      
      return NextResponse.json({
        success: true,
        message: 'Publisher database connection successful',
        connection: {
          current_time: connectionTest.rows[0].current_time,
          tables: tablesResult.rows.map(row => row.table_name)
        },
        publisher_submissions: {
          count: publisherSubmissionsCount,
          sample_data: sampleData
        }
      });
      
    } finally {
      client.release();
      await publisherPool.end();
    }
    
  } catch (error) {
    console.error('Publisher database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to connect to publisher database'
      },
      { status: 500 }
    );
  }
}
