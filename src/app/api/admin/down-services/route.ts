import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { getServicesWithEnhancedStatus } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    
    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    const services = await getServicesWithEnhancedStatus()
    
    // Filter only services that are down
    const downServices = services.filter(service => 
      service.enhancedStatus === 'outage' || 
      service.enhancedStatus === 'outage-with-incident'
    )

    // Separate services with and without incidents
    const withIncident = downServices.filter(s => s.enhancedStatus === 'outage-with-incident')
    const withoutIncident = downServices.filter(s => s.enhancedStatus === 'outage')

    return NextResponse.json({
      totalDown: downServices.length,
      withIncident,
      withoutIncident,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Down services fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch down services'
    }, { status: 500 })
  }
}