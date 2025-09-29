import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function POST() {
  try {
    const pool = getPool();
    
    // Add sample publisher requests
    const sampleRequests = [
      {
        publisher_name: 'John Smith',
        email: 'john.smith@example.com',
        company_name: 'TechCorp Marketing',
        telegram_id: '@johnsmith',
        offer_id: '58',
        creative_type: 'email',
        priority: 'high',
        status: 'pending',
        submitted_data: {
          campaign_type: 'email_marketing',
          target_audience: 'tech professionals',
          budget: '$5000',
          timeline: '2 weeks',
          additional_notes: 'Looking for high-converting email templates'
        }
      },
      {
        publisher_name: 'Sarah Johnson',
        email: 'sarah.j@digitalads.com',
        company_name: 'Digital Ads Pro',
        telegram_id: '@sarahj',
        offer_id: '54',
        creative_type: 'social',
        priority: 'medium',
        status: 'pending',
        submitted_data: {
          campaign_type: 'social_media',
          target_audience: 'millennials',
          budget: '$3000',
          timeline: '1 week',
          additional_notes: 'Need Instagram and Facebook creatives'
        }
      },
      {
        publisher_name: 'Mike Chen',
        email: 'mike.chen@affiliate.com',
        company_name: 'Affiliate Masters',
        telegram_id: '@mikechen',
        offer_id: '1',
        creative_type: 'banner',
        priority: 'low',
        status: 'admin_approved',
        submitted_data: {
          campaign_type: 'display_ads',
          target_audience: 'general',
          budget: '$2000',
          timeline: '3 days',
          additional_notes: 'Banner ads for website placement'
        }
      }
    ];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert sample requests
      for (const request of sampleRequests) {
        await client.query(`
          INSERT INTO publisher_requests (
            publisher_name, email, company_name, telegram_id, offer_id, 
            creative_type, priority, status, submitted_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          request.publisher_name,
          request.email,
          request.company_name,
          request.telegram_id,
          request.offer_id,
          request.creative_type,
          request.priority,
          request.status,
          JSON.stringify(request.submitted_data)
        ]);
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: 'Sample data added successfully',
        count: sampleRequests.length
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Add sample data error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to add sample data'
      },
      { status: 500 }
    );
  }
}
