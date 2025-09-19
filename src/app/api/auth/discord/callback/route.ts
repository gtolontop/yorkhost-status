import { NextRequest, NextResponse } from 'next/server'
import { discordAuth } from '@/lib/auth/discord'
import { createUserSession } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('Discord OAuth error:', error)
    return NextResponse.redirect(
      new URL('/auth/error?error=discord_oauth_error', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/error?error=missing_auth_code', request.url)
    )
  }

  try {
    // Authenticate user with Discord
    const authResult = await discordAuth.authenticateUser(code)

    if (!authResult.hasAccess) {
      return NextResponse.redirect(
        new URL('/auth/error?error=insufficient_permissions', request.url)
      )
    }

    // Create JWT session
    const token = await createUserSession(authResult.dbUser)

    // Create response with redirect to admin dashboard
    const response = NextResponse.redirect(new URL('/admin', request.url))

    // Set secure HTTP-only cookie with JWT
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Discord callback error:', error)
    
    return NextResponse.redirect(
      new URL('/auth/error?error=authentication_failed', request.url)
    )
  }
}