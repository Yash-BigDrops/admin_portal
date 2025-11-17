import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@repo/database'
import { PERMISSIONS, can } from '@repo/auth'

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
  try {
    const session = await auth()

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
      createdVia = 'manual',
      status = 'active',
    } = body

    if (!advertiserName || !advPlatform) {
      return NextResponse.json(
        { error: 'Advertiser name and platform are required' },
        { status: 400 }
      )
    }

    const pool = getPool()
    const result = await pool.query(
      `
      INSERT INTO advertisers (
        advertiser_name,
        company_name,
        email,
        website,
        adv_platform,
        platform_id,
        created_via,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        advertiserName,
        companyName || null,
        email || null,
        website || null,
        advPlatform,
        platformId || null,
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

