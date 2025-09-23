import { NextRequest, NextResponse } from 'next/server'
import { discordAuth } from '@/lib/auth/discord'

export async function GET(request: NextRequest) {
  try {
    // Get the full request URL to handle proxy redirects properly
    // Force HTTPS if NEXTAUTH_URL in env uses HTTPS
    const forwardedHost = request.headers.get('x-forwarded-host')
    const envUrl = process.env.NEXTAUTH_URL

    let requestUrl: string
    if (forwardedHost) {
      const proto = envUrl?.startsWith('https://') ? 'https' : (request.headers.get('x-forwarded-proto') || 'http')
      requestUrl = `${proto}://${forwardedHost}`
    } else {
      requestUrl = request.url
    }

    const authUrl = discordAuth.getAuthUrl(requestUrl)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Discord auth redirect error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to initiate Discord authentication'
    }, { status: 500 })
  }
}