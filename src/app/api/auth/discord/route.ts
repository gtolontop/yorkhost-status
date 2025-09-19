import { NextRequest, NextResponse } from 'next/server'
import { discordAuth } from '@/lib/auth/discord'

export async function GET(request: NextRequest) {
  try {
    const authUrl = discordAuth.getAuthUrl()
    
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Discord auth redirect error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate Discord authentication'
    }, { status: 500 })
  }
}