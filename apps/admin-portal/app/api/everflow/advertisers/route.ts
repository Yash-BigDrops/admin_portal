import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PERMISSIONS, can } from "@repo/auth"
import { everflowClient } from "@repo/config"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('[Everflow Advertisers API] Request received')
    const session = await auth()
    console.log('[Everflow Advertisers API] Session:', session?.user ? `User: ${session.user.email}` : 'No session')
    
    if (!session?.user) {
      console.warn('[Everflow Advertisers API] Unauthorized - no session')
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!can(session.user.role as string, PERMISSIONS.MANAGE_PUBLISHERS)) {
      console.warn('[Everflow Advertisers API] Forbidden - insufficient permissions for role:', session.user.role)
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string | number> = {}
    
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    console.log('[Everflow Advertisers API] Calling everflowClient.getAdvertisers with params:', params)
    const data = await everflowClient.getAdvertisers(params)
    console.log('[Everflow Advertisers API] Everflow response structure:', {
      hasData: !!data.data,
      isArray: Array.isArray(data),
      keys: Object.keys(data || {}),
      dataType: Array.isArray(data) ? 'array' : typeof data
    })

    // Handle different response formats from Everflow API
    let responseData: any = null
    let total: number = 0

    if (data && typeof data === 'object') {
      // Check if response has 'advertisers' key (common Everflow format)
      if (data.advertisers && Array.isArray(data.advertisers)) {
        responseData = data.advertisers
        total = data.paging?.total || data.advertisers.length || 0
      }
      // Check if response has 'data' key
      else if (data.data && Array.isArray(data.data)) {
        responseData = data.data
        total = data.total || data.paging?.total || data.data.length || 0
      }
      // Check if response is directly an array
      else if (Array.isArray(data)) {
        responseData = data
        total = data.length
      }
      // Otherwise use the data as-is
      else {
        responseData = data
        total = data.total || 0
      }
    } else {
      responseData = data
      total = Array.isArray(data) ? data.length : 0
    }

    console.log('[Everflow Advertisers API] Processed response:', {
      dataLength: Array.isArray(responseData) ? responseData.length : 'not array',
      total
    })

    return NextResponse.json({
      data: responseData,
      total: total,
    })
  } catch (error: any) {
    console.error("[Everflow Advertisers API] Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: error.message || "Failed to fetch advertisers from Everflow API",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

