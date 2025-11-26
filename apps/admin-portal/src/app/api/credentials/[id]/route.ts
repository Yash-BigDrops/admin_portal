import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getPool } from '@repo/database'
import { decrypt } from '@/lib/encryption'

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const pool = getPool()
    const { rows } = await pool.query(
      `
      SELECT 
        id,
        platform,
        account_name,
        encrypted_api_key,
        encrypted_secret,
        encrypted_data,
        created_by,
        created_at,
        updated_at
      FROM integration_credentials
      WHERE id = $1
    `,
      [id],
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    const cred = rows[0]

    // Decrypt sensitive fields
    const decrypted = {
      id: cred.id,
      platform: cred.platform,
      account_name: cred.account_name,
      api_key: decrypt(cred.encrypted_api_key),
      secret: cred.encrypted_secret ? decrypt(cred.encrypted_secret) : null,
      data: cred.encrypted_data?.encrypted
        ? JSON.parse(decrypt(cred.encrypted_data.encrypted))
        : null,
      created_by: cred.created_by,
      created_at: cred.created_at,
      updated_at: cred.updated_at,
    }

    return NextResponse.json({ credential: decrypted })
  } catch (error) {
    console.error('[credentials] GET [id] error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load credential',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const pool = getPool()
    const { rowCount } = await pool.query(
      `DELETE FROM integration_credentials WHERE id = $1`,
      [id],
    )

    if (rowCount === 0) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[credentials] DELETE error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete credential',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

