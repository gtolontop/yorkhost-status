import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (\!token) {
      return NextResponse.json({
        success: false,
        error: "Not authenticated"
      }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (\!payload) {
      return NextResponse.json({
        success: false,
        error: "Invalid token"
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payload.userId,
        username: payload.username,
        avatar: payload.avatar
      }
    })
  } catch (error) {
    console.error("Auth check error:", error)
    
    return NextResponse.json({
      success: false,
      error: "Authentication error"
    }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
