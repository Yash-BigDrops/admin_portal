import { NextRequest, NextResponse } from "next/server"
import { signIn } from "@/lib/auth"
import { getPool } from "@repo/database"
import bcrypt from "bcryptjs"
import { User } from "@repo/types"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const pool = getPool()
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND is_active = true",
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const user: User = result.rows[0]
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Update last login
    await pool.query(
      "UPDATE users SET last_login = NOW() WHERE id = $1",
      [user.id]
    )

    // Sign in with NextAuth
    await signIn("credentials", {
      email: user.email,
      password: password,
      redirect: false,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

