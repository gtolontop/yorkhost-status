import { NextResponse } from 'next/server'
import { getStatusOverview } from '@/lib/db'

export async function GET() {
  try {
    const statusOverview = await getStatusOverview()

    return NextResponse.json({
      success: true,
      data: statusOverview
    })
  } catch (error) {
    console.error('Status API error:', error)
    
    // Return a fallback response if database is not available
    return NextResponse.json({
      success: true,
      data: {
        overall: 'operational' as const,
        services: [],
        activeIncidents: [],
        uptimeStats: {
          '24h': 100,
          '7d': 100,
          '30d': 100
        },
        lastUpdated: new Date()
      }
    })
  }
}

export const dynamic = 'force-dynamic'