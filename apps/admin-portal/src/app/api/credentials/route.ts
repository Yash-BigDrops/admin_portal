import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getPool } from '@repo/database'
import { encrypt, decrypt } from '@/lib/encryption'
import { z } from 'zod'

const CreateSchema = z.object({
  platform: z.string().min(1).max(50),
  account_name: z.string().min(1).max(100),
  api_key: z.string().min(1),
  secret: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pool = getPool()
    const { rows } = await pool.query(
      `
      SELECT 
        id,
        platform,
        account_name,
        created_by,
        created_at,
        updated_at
      FROM integration_credentials
      ORDER BY platform, account_name
    `,
    )

    return NextResponse.json({ credentials: rows })
  } catch (error) {
    console.error('[credentials] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load credentials',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = CreateSchema.parse(body)

    const pool = getPool()

    const encryptedApiKey = encrypt(validated.api_key)
    const encryptedSecret = validated.secret ? encrypt(validated.secret) : null
    const encryptedData = validated.data
      ? { encrypted: encrypt(JSON.stringify(validated.data)) }
      : null

    const { rows } = await pool.query(
      `
      INSERT INTO integration_credentials (
        platform,
        account_name,
        encrypted_api_key,
        encrypted_secret,
        encrypted_data,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, platform, account_name, created_by, created_at
    `,
      [
        validated.platform,
        validated.account_name,
        encryptedApiKey,
        encryptedSecret,
        encryptedData,
        session.user?.email || 'unknown',
      ],
    )

    return NextResponse.json({ credential: rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }

    console.error('[credentials] POST error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create credential',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

