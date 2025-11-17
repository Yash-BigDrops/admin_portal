import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@repo/database'
import { PERMISSIONS, can } from '@repo/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role as string, PERMISSIONS.MANAGE_PUBLISHERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const pool = getPool()
    const result = await pool.query(`
      SELECT 
        id,
        advertiser_name as "advertiserName",
        company_name as "companyName",
        email,
        website,
        adv_platform as "advPlatform",
        platform_id as "platformId",
        platform_affiliate_id as "platformAffiliateId",
        api_key as "apiKey",
        platform_url as "platformUrl",
        created_via as "createdVia",
        api_adv_id as "apiAdvId",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM advertisers
      ORDER BY created_at DESC
    `)

    return NextResponse.json({
      advertisers: result.rows,
      total: result.rowCount,
    })
  } catch (error) {
    console.error('Get advertisers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/advertisers called')
  try {
    const session = await auth()
    console.log('[API] Session:', session?.user ? 'authenticated' : 'not authenticated')

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role as string, PERMISSIONS.MANAGE_PUBLISHERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    const {
      companyName,
      advertiserId,
      platformType,
      platformAffiliateId,
      apiKey,
      platformUrl,
      createdVia = 'manual',
      status = 'active',
    } = body

    if (!companyName || !advertiserId || !platformType) {
      return NextResponse.json(
        { error: 'Company name, advertiser ID, and platform type are required' },
        { status: 400 }
      )
    }

    const pool = getPool()
    
    // Check if advertisers table exists
    try {
      await pool.query('SELECT 1 FROM advertisers LIMIT 1')
    } catch (tableError: any) {
      if (tableError.code === '42P01') {
        return NextResponse.json(
          { error: 'Advertisers table does not exist. Please run the database setup script.' },
          { status: 500 }
        )
      }
    }

    const result = await pool.query(
      `
      INSERT INTO advertisers (
        advertiser_name,
        company_name,
        adv_platform,
        platform_id,
        platform_affiliate_id,
        api_key,
        platform_url,
        created_via,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        `${companyName} - ${advertiserId}`,
        companyName,
        platformType,
        advertiserId,
        platformAffiliateId || null,
        apiKey || null,
        platformUrl || null,
        createdVia,
        status,
        session.user.id,
      ]
    )

    return NextResponse.json({
      advertiser: result.rows[0],
      message: 'Advertiser created successfully',
    })
  } catch (error: any) {
    console.error('Create advertiser error:', error)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Advertiser with this name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

