import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';
import { getMultipleOffers } from '@/lib/everflow';
import { rateLimitMiddleware } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const syncedOnly = searchParams.get('synced') === '1';
    const searchQuery = searchParams.get('q') || '';
    const statusFilter = searchParams.get('status') || '';
    const priorityFilter = searchParams.get('priority') || '';
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    const pool = getPool();

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (syncedOnly) {
      conditions.push("(submitted_data ? 'original_id' OR submitted_data ? 'migrated_at')");
    }

    if (searchQuery) {
      conditions.push(`(
        publisher_name ILIKE $${paramIndex} OR
        company_name ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        offer_id ILIKE $${paramIndex}
      )`);
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }

    if (statusFilter) {
      conditions.push(`status = $${paramIndex}`);
      params.push(statusFilter);
      paramIndex++;
    }

    if (priorityFilter) {
      conditions.push(`priority = $${paramIndex}`);
      params.push(priorityFilter);
      paramIndex++;
    }

    if (fromDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const validSortColumns = ['created_at', 'priority', 'status', 'publisher_name', 'company_name'];
    const validSortOrder = ['ASC', 'DESC'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    params.push(limit, offset);

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
        admin_notes,
        created_at,
        updated_at
      FROM publisher_requests
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM publisher_requests
      ${whereClause}
    `, params.slice(0, -2));

    const offerIds = [...new Set(result.rows.map(row => row.offer_id).filter(Boolean))];
    
        let offerDetails: Record<string, { name: string; description: string; payout: number; currency: string; advertiserId?: string; advertiserName?: string }> = {};
        const everflowApiKey = process.env.EVERFLOW_API_KEY;
        
        console.log('🔍 Debug Info:');
        console.log('- EVERFLOW_API_KEY exists:', !!everflowApiKey);
        console.log('- Offer IDs found:', offerIds);
        console.log('- Number of offers to fetch:', offerIds.length);
        
        if (everflowApiKey && offerIds.length > 0) {
          try {
            console.log(`📡 Attempting to fetch details for ${offerIds.length} offers from Everflow...`);
            offerDetails = await getMultipleOffers(offerIds, everflowApiKey);
            console.log('✅ Successfully fetched offer details from Everflow');
            console.log('📊 Offer details received:', Object.keys(offerDetails).length, 'offers');
          } catch (error) {
            console.error('❌ Error fetching offer details from Everflow, using fallback:', error);
            // Fallback will be handled by getMultipleOffers function
            offerDetails = {};
          }
        } else {
          console.log('⚠️ Using fallback offer names - no API key or no offer IDs');
          // Use fallback mapping
          offerIds.forEach(offerId => {
            offerDetails[offerId] = {
              name: `Offer ${offerId}`,
              description: `Description for Offer ${offerId}`,
              payout: Math.floor(Math.random() * 100) + 10,
              currency: 'USD',
              advertiserId: `ADV${Math.floor(Math.random() * 1000)}`,
              advertiserName: `Advertiser ${Math.floor(Math.random() * 100)}`
            };
          });
        }

    const requests = result.rows.map(row => {
      const offerId = row.offer_id || 'N/A';
      const offerInfo = offerDetails[offerId];
      
        const requestData = {
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
          advertiserId: offerInfo?.advertiserId || `ADV${offerId}`,
          advertiserName: offerInfo?.advertiserName || `Advertiser ${offerId}`,
          type: row.creative_type || 'N/A',
          priority: row.priority === 'high' ? 'High Priority' : 
                    row.priority === 'medium' ? 'Moderate Priority' : 'Low Priority',
          status: row.status,
          publisherName: row.publisher_name,
          email: row.email,
          submittedData: row.submitted_data
        };
      
      // Debug logging for first few requests
      if (row.id === result.rows[0]?.id) {
        console.log('🔍 First request debug:');
        console.log('- Offer ID:', offerId);
        console.log('- Offer Info from Everflow:', offerInfo);
        console.log('- Final offer name:', requestData.offerName);
      }
      
      return requestData;
    });

    return NextResponse.json({ 
      requests,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}