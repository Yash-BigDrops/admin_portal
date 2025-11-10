import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPool } from "@repo/database"
import { PERMISSIONS, can } from "@repo/auth"

export async function GET() {
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

    const pool = getPool()
    
    // Get recent activity (last 10 requests)
    const result = await pool.query(
      `SELECT 
        id,
        publisher_name,
        email,
        status,
        created_at,
        updated_at
       FROM publisher_requests
       ORDER BY updated_at DESC
       LIMIT 10`
    )

    return NextResponse.json({
      items: result.rows,
    })
  } catch (error) {
    console.error("Recent activity error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

