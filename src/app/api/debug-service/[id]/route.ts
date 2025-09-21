import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        checks: {
          include: {
            results: {
              orderBy: { timestamp: 'desc' },
              take: 10
            }
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Calculate stats
    const allResults = service.checks.flatMap(check => check.results)
    const totalChecks = allResults.length
    const successfulChecks = allResults.filter(r => r.success).length
    const failedChecks = totalChecks - successfulChecks
    const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0

    return NextResponse.json({
      service: {
        id: service.id,
        name: service.name
      },
      stats: {
        totalChecks,
        successfulChecks,
        failedChecks,
        uptime: Math.round(uptime * 100) / 100
      },
      recentResults: allResults.slice(0, 10).map(r => ({
        timestamp: r.timestamp,
        success: r.success,
        responseTime: r.responseTime,
        error: r.error
      }))
    })
  } catch (error) {
    console.error('Debug service error:', error)
    return NextResponse.json({ error: 'Failed to debug service' }, { status: 500 })
  }
}