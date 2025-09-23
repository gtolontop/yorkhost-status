import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const serviceId = searchParams.get('serviceId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      // Only fetch INCIDENT type, not MAINTENANCE
      type: 'INCIDENT'
    }

    if (status) {
      const statuses = status.split(',')
      where.status = { in: statuses }
    }

    if (severity) {
      const severities = severity.split(',')
      where.severity = { in: severities }
    }

    if (serviceId) {
      where.serviceId = serviceId
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          updates: {
            orderBy: { timestamp: 'desc' },
            take: 1
          },
          service: true,
          machine: true,
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.incident.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        incidents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    })
  } catch (error) {
    console.error('Incidents fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch incidents'
    }, { status: 500 })
  }
}