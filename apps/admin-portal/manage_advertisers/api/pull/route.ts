import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@repo/database'
import { PERMISSIONS, can } from '@repo/auth'

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
    const { platform, apiAdvId } = body

    if (!platform || !apiAdvId) {
      return NextResponse.json(
        { error: 'Platform and advertiser ID are required' },
        { status: 400 }
      )
    }

    // TODO: Implement actual API integration with external platforms
    // For now, this is a mock implementation
    // In production, you would:
    // 1. Call the external platform API (Cake, Everflow, etc.)
    // 2. Fetch advertiser data
    // 3. Store it in the database

    const pool = getPool()

    // Check if advertiser already exists
    const existing = await pool.query(
      `SELECT id FROM advertisers WHERE api_adv_id = $1 AND adv_platform = $2`,
      [apiAdvId, platform]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Advertiser already exists' },
        { status: 409 }
      )
    }

    // Mock advertiser data - replace with actual API call
    const mockAdvertiserData = {
      advertiserName: `Advertiser from ${platform} (ID: ${apiAdvId})`,
      advPlatform: platform,
      apiAdvId: apiAdvId,
      createdVia: 'api',
      status: 'active',
    }

    const result = await pool.query(
      `
      INSERT INTO advertisers (
        advertiser_name,
        adv_platform,
        platform_id,
        api_adv_id,
        created_via,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        mockAdvertiserData.advertiserName,
        mockAdvertiserData.advPlatform,
        apiAdvId,
        apiAdvId,
        mockAdvertiserData.createdVia,
        mockAdvertiserData.status,
        session.user.id,
      ]
    )

    return NextResponse.json({
      advertiser: result.rows[0],
      message: 'Advertiser pulled from API successfully',
    })
  } catch (error: any) {
    console.error('Pull advertiser error:', error)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Advertiser already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

