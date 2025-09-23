import { NextRequest, NextResponse } from 'next/server'
import { discordAuth } from '@/lib/auth/discord'
import { createUserSession } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Get the base URL with proper proxy handling
  const getBaseUrl = () => {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const envUrl = process.env.NEXTAUTH_URL

    if (forwardedHost) {
      // Force HTTPS if NEXTAUTH_URL uses HTTPS
      const proto = envUrl?.startsWith('https://') ? 'https' : (request.headers.get('x-forwarded-proto') || 'http')
      return `${proto}://${forwardedHost}`
    }

    const url = new URL(request.url)
    return `${url.protocol}//${url.host}`
  }

  const baseUrl = getBaseUrl()

  if (error) {
    console.error('Discord OAuth error:', error)
    return NextResponse.redirect(`${baseUrl}/auth/error?error=discord_oauth_error`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/auth/error?error=missing_auth_code`)
  }

  try {
    // Authenticate user with Discord, passing the full request URL for redirect URI
    const forwardedHost = request.headers.get('x-forwarded-host')
    const envUrl = process.env.NEXTAUTH_URL

    let requestUrl: string
    if (forwardedHost) {
      const proto = envUrl?.startsWith('https://') ? 'https' : (request.headers.get('x-forwarded-proto') || 'http')
      requestUrl = `${proto}://${forwardedHost}`
    } else {
      requestUrl = request.url
    }

    const authResult = await discordAuth.authenticateUser(code, requestUrl)

    if (!authResult.hasAccess) {
      return NextResponse.redirect(`${baseUrl}/auth/error?error=insufficient_permissions`)
    }

    // Create JWT session
    const sessionData = await createUserSession(authResult.dbUser)

    // Create response with redirect to admin dashboard
    const response = NextResponse.redirect(`${baseUrl}/admin`)

    // Set secure HTTP-only cookie with JWT
    response.cookies.set('auth-token', sessionData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Discord callback error:', error)

    return NextResponse.redirect(`${baseUrl}/auth/error?error=authentication_failed`)
  }
}