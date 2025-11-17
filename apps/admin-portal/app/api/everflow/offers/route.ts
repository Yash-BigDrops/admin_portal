import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PERMISSIONS, can } from "@repo/auth"
import { everflowClient } from "@repo/config"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!can(session.user.role as string, PERMISSIONS.VIEW_ANALYTICS)) {
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

    const data = await everflowClient.getOffers(params)

    return NextResponse.json({
      data: data.data || data,
      total: data.total || data.length || 0,
    })
  } catch (error: any) {
    console.error("Everflow offers API error:", error)
    return NextResponse.json(
      { 
        error: error.message || "Failed to fetch offers from Everflow API",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

