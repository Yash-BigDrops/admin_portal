import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@repo/database'
import { PERMISSIONS, can } from '@repo/auth'
import { everflowClient } from '@repo/config'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('[Pull Advertiser] Request received')
    
    const session = await auth()
    console.log('[Pull Advertiser] Session:', session?.user ? 'Authenticated' : 'Not authenticated')

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user.role as string, PERMISSIONS.MANAGE_PUBLISHERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
      console.log('[Pull Advertiser] Request body:', { platform: body.platform, apiAdvId: body.apiAdvId })
    } catch (parseError: any) {
      console.error('[Pull Advertiser] JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { platform, apiAdvId } = body

    if (!platform || !apiAdvId) {
      return NextResponse.json(
        { error: 'Platform and advertiser ID are required' },
        { status: 400 }
      )
    }

    console.log('[Pull Advertiser] Getting database pool')
    const pool = getPool()

    // Check if advertiser already exists
    console.log('[Pull Advertiser] Checking if advertiser exists in database')
    const existing = await pool.query(
      `SELECT id FROM advertisers WHERE api_adv_id = $1 AND adv_platform = $2`,
      [apiAdvId, platform]
    )
    console.log('[Pull Advertiser] Existing check result:', existing.rows.length > 0 ? 'Exists' : 'Not found')

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Advertiser already exists' },
        { status: 409 }
      )
    }

    let advertiserData: any = null

    // Fetch from Everflow API if platform is Everflow
    if (platform.toLowerCase() === 'everflow') {
      try {
        console.log(`[Pull Advertiser] Platform is Everflow, fetching advertiser ID: ${apiAdvId}`)
        console.log(`[Pull Advertiser] Everflow client available:`, !!everflowClient)
        
        // Everflow API doesn't support direct advertiser fetch by ID endpoint
        // We need to fetch the list and filter by ID
        console.log(`[Pull Advertiser] Fetching all advertisers to find ID: ${apiAdvId}`)
        const allAdvertisers = await everflowClient.getAdvertisers()
        
        console.log(`[Pull Advertiser] Everflow API response structure:`, {
          hasData: !!allAdvertisers?.data,
          isArray: Array.isArray(allAdvertisers),
          hasAdvertisers: !!allAdvertisers?.advertisers,
          keys: allAdvertisers ? Object.keys(allAdvertisers) : [],
          type: typeof allAdvertisers
        })
        
        // Handle different response formats from Everflow API
        let advertisersArray: any[] = []
        if (allAdvertisers && typeof allAdvertisers === 'object') {
          // Check if response has 'data' key
          if (allAdvertisers.data && Array.isArray(allAdvertisers.data)) {
            advertisersArray = allAdvertisers.data
            console.log(`[Pull Advertiser] Found ${advertisersArray.length} advertisers in response.data`)
          }
          // Check if response has 'advertisers' key
          else if (allAdvertisers.advertisers && Array.isArray(allAdvertisers.advertisers)) {
            advertisersArray = allAdvertisers.advertisers
            console.log(`[Pull Advertiser] Found ${advertisersArray.length} advertisers in response.advertisers`)
          }
          // Check if response is directly an array
          else if (Array.isArray(allAdvertisers)) {
            advertisersArray = allAdvertisers
            console.log(`[Pull Advertiser] Response is directly an array with ${advertisersArray.length} advertisers`)
          }
        }
        
        if (advertisersArray.length === 0) {
          console.error(`[Pull Advertiser] No advertisers found in response! Response:`, JSON.stringify(allAdvertisers, null, 2).substring(0, 500))
          throw new Error('No advertisers returned from Everflow API')
        }
        
        console.log(`[Pull Advertiser] Processing ${advertisersArray.length} advertisers`)
        console.log(`[Pull Advertiser] First advertiser sample:`, {
          network_advertiser_id: advertisersArray[0]?.network_advertiser_id,
          advertiser_id: advertisersArray[0]?.advertiser_id,
          id: advertisersArray[0]?.id,
          name: advertisersArray[0]?.name || advertisersArray[0]?.network_advertiser_name
        })
        
        // Try to find advertiser by various ID fields
        const searchId = String(apiAdvId)
        console.log(`[Pull Advertiser] Searching for ID: "${searchId}" (type: ${typeof searchId})`)
        
        advertiserData = advertisersArray.find((adv: any) => {
          // Check multiple possible ID field names
          const possibleIds = [
            adv.network_advertiser_id,
            adv.advertiser_id,
            adv.id,
            adv.advertiserId
          ].filter(id => id !== undefined && id !== null).map(id => String(id))
          
          // Only log if it's a potential match (to reduce verbosity)
          if (possibleIds.includes(searchId)) {
            console.log(`[Pull Advertiser] ✅ Match found!`, {
              network_advertiser_id: adv.network_advertiser_id,
              advertiser_id: adv.advertiser_id,
              id: adv.id,
              matchedId: possibleIds.find(id => id === searchId)
            })
          }
          
          return possibleIds.includes(searchId)
        })
        
        if (advertiserData) {
          console.log(`[Pull Advertiser] ✅ Found advertiser in list:`, {
            id: advertiserData.network_advertiser_id || advertiserData.advertiser_id || advertiserData.id,
            name: advertiserData.network_advertiser_name || advertiserData.advertiser_name || advertiserData.name
          })
        } else {
          console.error(`[Pull Advertiser] ❌ Advertiser not found. Search ID: "${searchId}"`)
          console.error(`[Pull Advertiser] Available IDs (first 20):`, 
            advertisersArray.slice(0, 20).map((a: any) => ({
              network_advertiser_id: a.network_advertiser_id,
              advertiser_id: a.advertiser_id,
              id: a.id,
              name: a.network_advertiser_name || a.advertiser_name || a.name,
              allIds: [
                String(a.network_advertiser_id || ''),
                String(a.advertiser_id || ''),
                String(a.id || '')
              ].filter(Boolean)
            }))
          )
          throw new Error(`Advertiser with ID ${apiAdvId} not found in Everflow. Please verify the advertiser ID exists in your Everflow account.`)
        }
      } catch (apiError: any) {
        console.error('[Pull Advertiser] Everflow API error:', apiError)
        return NextResponse.json(
          { 
            error: `Failed to fetch advertiser from Everflow: ${apiError.message}`,
            details: process.env.NODE_ENV === 'development' ? apiError.stack : undefined
          },
          { status: 500 }
        )
      }
    } else {
      // For other platforms (Cake, HasOffers, etc.), use mock data for now
      // TODO: Implement actual API integration for other platforms
      advertiserData = {
        advertiser_name: `Advertiser from ${platform} (ID: ${apiAdvId})`,
        status: 'active',
      }
    }

    // Extract advertiser information
    console.log('[Pull Advertiser] Extracting advertiser information from response')
    console.log('[Pull Advertiser] Advertiser data keys:', Object.keys(advertiserData || {}))
    
    const advertiserName = advertiserData?.advertiser_name || 
                          advertiserData?.name || 
                          advertiserData?.network_advertiser_name ||
                          `Advertiser from ${platform} (ID: ${apiAdvId})`
    const companyName = advertiserData?.company_name || advertiserData?.company || null
    const email = advertiserData?.email || null
    const website = advertiserData?.website || null

    console.log('[Pull Advertiser] Extracted data:', {
      advertiserName,
      companyName,
      email,
      website
    })

    console.log('[Pull Advertiser] Inserting advertiser into database')
    const result = await pool.query(
      `
      INSERT INTO advertisers (
        advertiser_name,
        company_name,
        email,
        website,
        adv_platform,
        platform_id,
        api_adv_id,
        created_via,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        advertiserName,
        companyName,
        email,
        website,
        platform,
        apiAdvId,
        apiAdvId,
        'api',
        'active',
        session.user.id,
      ]
    )

    return NextResponse.json({
      advertiser: result.rows[0],
      message: 'Advertiser pulled from API successfully',
    })
  } catch (error: any) {
    console.error('='.repeat(50))
    console.error('[Pull Advertiser] ERROR CAUGHT')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error?.message)
    console.error('Error code:', error?.code)
    console.error('Error stack:', error?.stack)
    if (error.cause) {
      console.error('Error cause:', error.cause)
    }
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error('='.repeat(50))
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Advertiser already exists' },
        { status: 409 }
      )
    }
    
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    const errorDetails = process.env.NODE_ENV === 'development' ? {
      message: errorMessage,
      stack: error?.stack,
      code: error?.code,
      name: error?.name
    } : undefined
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}

