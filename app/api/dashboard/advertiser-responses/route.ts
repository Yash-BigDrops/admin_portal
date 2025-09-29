import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';
import { getMultipleOffers } from '@/lib/everflow';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const pool = getPool();

    const result = await pool.query(`
      SELECT 
        id,
        publisher_name,
        email,
        company_name,
        offer_id,
        creative_type,
        priority,
        status,
        submitted_data,
        created_at
      FROM publisher_requests
      WHERE status IN ('admin_approved', 'admin_rejected')
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const offerIds = [...new Set(result.rows.map(row => row.offer_id).filter(Boolean))];
    
    let offerDetails: Record<string, { name?: string; description?: string; payout?: number; currency?: string }> = {};
    const everflowApiKey = process.env.EVERFLOW_API_KEY;
    
    if (everflowApiKey && offerIds.length > 0) {
      try {
        console.log(`Fetching details for ${offerIds.length} offers from Everflow...`);
        offerDetails = await getMultipleOffers(offerIds, everflowApiKey);
        console.log('Successfully fetched offer details from Everflow');
      } catch (error) {
        console.error('Error fetching offer details from Everflow:', error);
      }
    }

    const responses = result.rows.map(row => {
      const offerId = row.offer_id || 'N/A';
      const offerInfo = offerDetails[offerId];
      
      return {
        id: row.id,
        date: new Date(row.created_at).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        company: row.company_name || 'N/A',
        offerId: offerId,
        offerName: offerInfo?.name || `Offer ${offerId}`,
        offerDescription: offerInfo?.description || '',
        offerPayout: offerInfo?.payout || null,
        offerCurrency: offerInfo?.currency || 'USD',
        type: row.creative_type || 'N/A',
        priority: row.priority === 'high' ? 'High Priority' : 
                  row.priority === 'medium' ? 'Moderate Priority' : 'Low Priority',
        status: row.status,
        publisherName: row.publisher_name,
        email: row.email,
        submittedData: row.submitted_data
      };
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Error fetching advertiser responses:', error);
    return NextResponse.json({ error: 'Failed to fetch advertiser responses' }, { status: 500 });
  }
}
