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
      advertiserName,
      companyName,
      email,
      website,
      advPlatform,
      platformId,
      status,
    } = body

    const pool = getPool()
    const result = await pool.query(
      `
      UPDATE advertisers
      SET 
        advertiser_name = COALESCE($1, advertiser_name),
        company_name = COALESCE($2, company_name),
        email = COALESCE($3, email),
        website = COALESCE($4, website),
        adv_platform = COALESCE($5, adv_platform),
        platform_id = COALESCE($6, platform_id),
        status = COALESCE($7, status),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `,
      [
        advertiserName,
        companyName,
        email,
        website,
        advPlatform,
        platformId,
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

