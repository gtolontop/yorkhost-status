import { NextRequest, NextResponse } from 'next/server'
import { discordAuth } from '@/lib/auth/discord'

export async function GET(request: NextRequest) {
  try {
    // Get the full request URL to handle proxy redirects properly
    const requestUrl = request.headers.get('x-forwarded-host')
      ? `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('x-forwarded-host')}`
      : request.url

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