import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { calculateServiceStatus, calculateUptime, getLatestResponseTime, getLastCheckTime, convertStatusToMonitoring } from '@/lib/status-calculator'

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
      const allResults = service.checks.flatMap(check => check.results)
      
      // Use shared status calculation logic
      const status = calculateServiceStatus(allResults)
      const uptime = calculateUptime(allResults)
      const responseTime = getLatestResponseTime(allResults)
      const lastCheck = getLastCheckTime(allResults)

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
        status: convertStatusToMonitoring(status),
        uptime,
        responseTime,
        lastCheck,
        machine: service.machine?.name || 'Unknown',
        url: service.url,
        checkHistory
      }
    })

    // Calculate system metrics
    const totalServices = services.length
    const servicesUp = monitoringServices.filter(s => s.status === 'up').length
    
    // Calculate average response time only for services that are up
    const upServices = monitoringServices.filter(s => s.status === 'up' && s.responseTime > 0)
    const avgResponseTime = upServices.length > 0 
      ? Math.round(upServices.reduce((sum, s) => sum + s.responseTime, 0) / upServices.length)
      : 0
    
    // Calculate global uptime
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