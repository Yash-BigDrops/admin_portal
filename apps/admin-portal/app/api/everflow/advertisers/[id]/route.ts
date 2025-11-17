import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PERMISSIONS, can } from "@repo/auth"
import { everflowClient } from "@repo/config"

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!can(session.user.role as string, PERMISSIONS.MANAGE_PUBLISHERS)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const data = await everflowClient.getAdvertiser(id)

    return NextResponse.json({
      data: data,
    })
  } catch (error: any) {
    console.error("Everflow advertiser API error:", error)
    return NextResponse.json(
      { 
        error: error.message || "Failed to fetch advertiser from Everflow API",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

