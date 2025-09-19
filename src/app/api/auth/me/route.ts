import { NextRequest, NextResponse } from 'next/server'
import { validateUserSession } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const session = await validateUserSession(token)

    if (!session.valid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          discordId: session.user.discordId,
          username: session.user.username,
          avatar: session.user.avatar,
          email: session.user.email,
          role: session.payload?.role,
          permissions: session.payload?.permissions
        }
      }
    })
  } catch (error) {
    console.error('Auth me error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}