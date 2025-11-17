import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';
import { z } from 'zod';

const submissionSchema = z.object({
  affiliateId: z.string(),
  companyName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  telegramId: z.string().optional(),
  offerId: z.string(),
  creativeType: z.string(),
  priority: z.string(),
  additionalNotes: z.string().optional(),
  uploadedFiles: z.array(z.object({
    fileId: z.string(),
    fileName: z.string(),
    fileUrl: z.string(),
  })).optional(),
  submissionDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.PUBLISHER_API_TOKEN || 'test-token-123';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = submissionSchema.parse(body);

    const pool = getPool();

    // Use submissionDate if provided, otherwise use current time
    const createdAt = validatedData.submissionDate 
      ? new Date(validatedData.submissionDate).toISOString()
      : new Date().toISOString();

    const result = await pool.query(`
      INSERT INTO publisher_requests (
        publisher_name, email, company_name, telegram_id, offer_id,
        creative_type, priority, status, submitted_data, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9) RETURNING id
    `, [
      `${validatedData.firstName} ${validatedData.lastName}`,
      validatedData.email,
      validatedData.companyName,
      validatedData.telegramId || null,
      validatedData.offerId,
      validatedData.creativeType,
      validatedData.priority,
      JSON.stringify(validatedData),
      createdAt
    ]);

    if (!result.rows[0]) {
      throw new Error('Failed to insert submission');
    }

    return NextResponse.json({ success: true, submissionId: result.rows[0].id });

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
  }
}
