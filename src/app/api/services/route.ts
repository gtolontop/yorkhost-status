import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentStatus, getUptimePercentage } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const services = await prisma.service.findMany({
      include: {
        machine: true,
        checks: {
          include: {
            results: {
              take: 100,
              orderBy: { timestamp: 'desc' }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate status and uptime for each service
    const servicesWithStatus = await Promise.all(
      services.map(async (service) => {
        const status = getCurrentStatus(service)
        const uptimePercent24h = await getUptimePercentage(service.id, 24)
        
        return {
          ...service,
          status,
          uptimePercent24h
        }
      })
    )

    return NextResponse.json(servicesWithStatus)
  } catch (error) {
    console.error('Services fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch services'
    }, { status: 500 })
  }
}