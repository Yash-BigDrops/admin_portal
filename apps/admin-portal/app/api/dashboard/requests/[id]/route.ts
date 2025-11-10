import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPool } from "@repo/database"
import { PERMISSIONS, can } from "@repo/auth"
import { PublisherRequest } from "@repo/types"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const pool = getPool()
    const result = await pool.query(
      "SELECT * FROM publisher_requests WHERE id = $1",
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      )
    }

    const request: PublisherRequest = result.rows[0]
    return NextResponse.json({ request })
  } catch (error) {
    console.error("Get request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

