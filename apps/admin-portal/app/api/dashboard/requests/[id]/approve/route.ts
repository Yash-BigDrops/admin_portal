import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPool } from "@repo/database"
import { PERMISSIONS, can } from "@repo/auth"

export async function POST(
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

    const { notes } = await request.json()
    const pool = getPool()

    // Update request status
    await pool.query(
      `UPDATE publisher_requests 
       SET status = 'approved', 
           approved_by = $1, 
           approved_at = NOW(),
           admin_notes = COALESCE($2, admin_notes),
           updated_at = NOW()
       WHERE id = $3`,
      [session.user.id, notes, params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Approve request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

