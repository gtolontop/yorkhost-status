import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    // Get all services with their latest checks
    const services = await prisma.service.findMany({
      include: {
        machine: true,
        checks: {
          include: {
            results: {
              take: 20,
              orderBy: { timestamp: 'desc' }
            }
          }
        }
      }
    })

    // Transform services to monitoring format
    const monitoringServices = services.map(service => {
      const latestResult = service.checks[0]?.results[0]
      const allResults = service.checks.flatMap(check => check.results)
      
      // Calculate uptime from recent results
      const successfulChecks = allResults.filter(r => r.success).length
      const uptime = allResults.length > 0 ? (successfulChecks / allResults.length) * 100 : 100

      // Get check history
      const checkHistory = allResults.slice(0, 20).reverse().map(result => ({
        timestamp: result.timestamp.toISOString(),
        success: result.success,
        responseTime: result.responseTime || 0,
        error: result.error || undefined
      }))

      return {
        id: service.id,
        name: service.name,
        category: service.machine?.category || 'other',
        status: latestResult?.success ? 'up' : 'down',
        uptime: Math.round(uptime * 100) / 100,
        responseTime: latestResult?.responseTime || 0,
        lastCheck: latestResult?.timestamp?.toISOString() || new Date().toISOString(),
        machine: service.machine?.name || 'Unknown',
        url: service.url,
        checkHistory
      }
    })

    // Calculate system metrics
    const totalServices = services.length
    const servicesUp = monitoringServices.filter(s => s.status === 'up').length
    const avgResponseTime = monitoringServices.length > 0 
      ? Math.round(monitoringServices.reduce((sum, s) => sum + s.responseTime, 0) / monitoringServices.length)
      : 0
    const globalUptime = monitoringServices.length > 0
      ? Math.round(monitoringServices.reduce((sum, s) => sum + s.uptime, 0) / monitoringServices.length * 100) / 100
      : 100
    const activeIncidents = await prisma.incident.count({
      where: {
        status: {
          in: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING']
        }
      }
    })

    const metrics = [
      {
        name: 'Services en ligne',
        value: servicesUp,
        unit: '',
        status: servicesUp === totalServices ? 'good' : servicesUp > totalServices * 0.8 ? 'warning' : 'critical',
        trend: 'stable',
        change: 0
      },
      {
        name: 'Temps de réponse moyen',
        value: avgResponseTime,
        unit: 'ms',
        status: avgResponseTime < 200 ? 'good' : avgResponseTime < 500 ? 'warning' : 'critical',
        trend: 'down',
        change: -5.2
      },
      {
        name: 'Uptime global',
        value: globalUptime,
        unit: '%',
        status: globalUptime > 99 ? 'good' : globalUptime > 95 ? 'warning' : 'critical',
        trend: 'up',
        change: 0.1
      },
      {
        name: 'Incidents actifs',
        value: activeIncidents,
        unit: '',
        status: activeIncidents === 0 ? 'good' : activeIncidents < 3 ? 'warning' : 'critical',
        trend: 'stable',
        change: 0
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        services: monitoringServices,
        metrics
      }
    })
  } catch (error) {
    console.error('Monitoring API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch monitoring data'
    }, { status: 500 })
  }
}