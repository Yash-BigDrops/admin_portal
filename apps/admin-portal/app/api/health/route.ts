import { NextResponse } from "next/server"
import { getPool } from "@repo/database"

export async function GET() {
  try {
    const pool = getPool()
    await pool.query("SELECT 1")
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    )
  }
}

