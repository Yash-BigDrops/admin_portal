import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPool } from "@repo/database"
import { PERMISSIONS, can } from "@repo/auth"

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
    const limit = parseInt(searchParams.get("limit") || "10")

    const pool = getPool()
    
    // Get advertiser responses (approved requests with client notes)
    const result = await pool.query(`
      SELECT 
        id,
        publisher_name,
        email,
        client_notes,
        approved_at,
        created_at
      FROM publisher_requests
      WHERE status = 'approved' AND client_notes IS NOT NULL
      ORDER BY approved_at DESC
      LIMIT $1
    `, [limit])

    return NextResponse.json({
      responses: result.rows,
    })
  } catch (error) {
    console.error("Advertiser responses error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

