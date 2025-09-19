import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/jwt'
import { getDashboardStats, prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return NextResponse.json({
        success: false,
        error: auth.error || 'Unauthorized'
      }, { status: 401 })
    }

    const dashboardStats = await getDashboardStats()
    
    // Get recent activities
    const recentActivities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        }
      }
    })

    // Get services with latest status
    const services = await prisma.service.findMany({
      take: 5,
      include: {
        machine: true,
        checks: {
          include: {
            results: {
              take: 1,
              orderBy: { timestamp: 'desc' }
            }
          }
        }
      }
    })

    // Transform activities
    const activities = recentActivities.map(log => ({
      id: log.id,
      type: log.resource.toLowerCase(),
      title: `${log.action} ${log.resource}`,
      description: `${log.user?.username || 'Système'} a ${log.action.toLowerCase()} ${log.resource.toLowerCase()}`,
      timestamp: log.createdAt.toISOString(),
      status: log.action === 'CREATE' ? 'success' : log.action === 'DELETE' ? 'error' : 'warning'
    }))

    // Transform services  
    const servicesWithStatus = services.map(service => {
      const latestResult = service.checks[0]?.results[0]
      return {
        id: service.id,
        name: service.name,
        status: latestResult?.success ? 'operational' : 'outage',
        uptime: 99.5, // Calculate from checks
        responseTime: latestResult?.responseTime || 0,
        lastCheck: latestResult?.timestamp?.toISOString() || new Date().toISOString()
      }
    })

    const stats = {
      totalServices: dashboardStats.totalServices,
      totalMachines: await prisma.machine.count(),
      activeIncidents: dashboardStats.activeIncidents,
      averageUptime: dashboardStats.averageUptime,
      checksLast24h: dashboardStats.checksLast24h,
      responseTimeP95: dashboardStats.responseTimeP95,
      mttr: dashboardStats.mttr,
      uptimeChange: 0.12,
      responseTimeChange: -5.3
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        activities,
        services: servicesWithStatus
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    }, { status: 500 })
  }
}