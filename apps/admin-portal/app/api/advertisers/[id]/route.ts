import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@repo/database'
import { PERMISSIONS, can } from '@repo/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role as string, PERMISSIONS.MANAGE_PUBLISHERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const pool = getPool()
    const result = await pool.query(
      `
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
      WHERE id = $1
    `,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Advertiser not found' }, { status: 404 })
    }

    return NextResponse.json({ advertiser: result.rows[0] })
  } catch (error) {
    console.error('Get advertiser error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role as string, PERMISSIONS.MANAGE_PUBLISHERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      companyName,
      advertiserId,
      platformType,
      platformAffiliateId,
      apiKey,
      platformUrl,
      status,
    } = body

    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE advertisers
      SET 
        advertiser_name = COALESCE($1, advertiser_name),
        company_name = COALESCE($2, company_name),
        adv_platform = COALESCE($3, adv_platform),
        platform_id = COALESCE($4, platform_id),
        platform_affiliate_id = COALESCE($5, platform_affiliate_id),
        api_key = COALESCE($6, api_key),
        platform_url = COALESCE($7, platform_url),
        status = COALESCE($8, status),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `,
      [
        companyName && advertiserId ? `${companyName} - ${advertiserId}` : null,
        companyName,
        platformType,
        advertiserId,
        platformAffiliateId,
        apiKey,
        platformUrl,
        status,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Advertiser not found' }, { status: 404 })
    }

    return NextResponse.json({
      advertiser: result.rows[0],
      message: 'Advertiser updated successfully',
    })
  } catch (error) {
    console.error('Update advertiser error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role as string, PERMISSIONS.MANAGE_PUBLISHERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      )
    }

    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE advertisers
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `,
      [status, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Advertiser not found' }, { status: 404 })
    }

    return NextResponse.json({
      advertiser: result.rows[0],
      message: 'Advertiser status updated successfully',
    })
  } catch (error) {
    console.error('Update advertiser status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role as string, PERMISSIONS.MANAGE_PUBLISHERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const pool = getPool()
    const result = await pool.query(
      `
      DELETE FROM advertisers
      WHERE id = $1
      RETURNING id, advertiser_name
    `,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Advertiser not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Advertiser deleted successfully',
      deletedId: result.rows[0].id,
    })
  } catch (error) {
    console.error('Delete advertiser error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

