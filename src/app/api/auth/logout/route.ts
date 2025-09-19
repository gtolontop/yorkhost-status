import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    })

    // Clear the auth token cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    
    return NextResponse.json({
      success: false,
      error: "Logout error"
    }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
