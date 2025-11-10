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

    // Check permissions
    if (!can(session.user.role as string, PERMISSIONS.VIEW_ANALYTICS)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const pool = getPool()
    
    // Get dashboard metrics
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM publisher_requests"),
      pool.query(
        "SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'pending'"
      ),
      pool.query(
        "SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'approved'"
      ),
      pool.query(
        "SELECT COUNT(*) as count FROM publisher_requests WHERE status = 'rejected'"
      ),
    ])

    return NextResponse.json({
      metrics: {
        total: parseInt(totalRequests.rows[0].count),
        pending: parseInt(pendingRequests.rows[0].count),
        approved: parseInt(approvedRequests.rows[0].count),
        rejected: parseInt(rejectedRequests.rows[0].count),
      },
    })
  } catch (error) {
    console.error("Metrics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

