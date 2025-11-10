import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPool } from "@repo/database"
import { PERMISSIONS, can } from "@repo/auth"
import { PublisherRequest } from "@repo/types"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const pool = getPool()
    let query = "SELECT * FROM publisher_requests"
    const params: any[] = []
    
    if (status) {
      query += " WHERE status = $1"
      params.push(status)
    }
    
    query += " ORDER BY created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2)
    params.push(limit, offset)

    const result = await pool.query(query, params)
    const requests: PublisherRequest[] = result.rows

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total: result.rowCount || 0,
      },
    })
  } catch (error) {
    console.error("Get requests error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

