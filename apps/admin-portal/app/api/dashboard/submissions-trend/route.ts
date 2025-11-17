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
    
    // Get submissions trend for last 24 hours (grouped by hour)
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as count
      FROM publisher_requests
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour ASC
    `)

    // Create array with 24 hours, filling in missing hours with 0
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date()
      hour.setHours(hour.getHours() - (23 - i))
      hour.setMinutes(0)
      hour.setSeconds(0)
      hour.setMilliseconds(0)
      return hour.toISOString()
    })

    const dataMap = new Map(
      result.rows.map((row: any) => [
        new Date(row.hour).toISOString(),
        parseInt(row.count)
      ])
    )

    const data = hours.map(hour => ({
      hour,
      count: dataMap.get(hour) || 0
    }))

    const total = result.rows.reduce((sum: number, row: any) => sum + parseInt(row.count), 0)

    return NextResponse.json({
      data,
      totals: {
        last24Hours: total,
        today: total, // Simplified - can be enhanced
      },
    })
  } catch (error) {
    console.error("Submissions trend error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

