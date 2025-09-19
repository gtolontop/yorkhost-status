import { NextRequest, NextResponse } from 'next/server'
import { getStatusOverview } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const overview = await getStatusOverview()

    return NextResponse.json({
      success: true,
      data: overview
    })
  } catch (error) {
    console.error('Status overview error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch status overview'
    }, { status: 500 })
  }
}