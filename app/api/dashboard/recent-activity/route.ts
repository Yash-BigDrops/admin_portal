import { NextResponse } from "next/server";
import { getPool } from "@/lib/database/db";
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  const startTime = Date.now();
  try {
    console.log('📋 Recent activity query started');
    const pool = getPool();
    const q = `
      SELECT 
        id,
        submitted_data->>'offerId'      AS offer_id,
        submitted_data->>'offerName'    AS offer_name,
        submitted_data->>'affiliateId'  AS affiliate_id,
        submitted_data->>'affiliateName'AS affiliate_name,
        created_at
      FROM publisher_requests
      WHERE (submitted_data ? 'original_id' OR submitted_data ? 'migrated_at')
      ORDER BY created_at DESC
      LIMIT 25
    `;
    const { rows } = await pool.query(q);
    const duration = Date.now() - startTime;
    console.log(`📋 Recent activity query completed in ${duration}ms, found ${rows.length} items`);
    return NextResponse.json({
      items: rows.map(r => ({
        id: r.id,
        offerId: r.offer_id,
        offerName: r.offer_name,
        affiliateId: r.affiliate_id,
        affiliateName: r.affiliate_name,
        createdAt: r.created_at
      }))
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`📋 Recent activity query failed after ${duration}ms:`, error);
    return NextResponse.json({ error: "Failed to load recent activity" }, { status: 500 });
  }
}
