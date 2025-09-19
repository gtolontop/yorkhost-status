import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database helper functions
export async function getServiceWithStats(serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      machine: true,
      checks: {
        include: {
          results: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      }
    }
  })

  if (!service) return null

  // Calculate uptime statistics
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const checkIds = service.checks.map(check => check.id)

  const [
    results24h,
    results7d,
    results30d
  ] = await Promise.all([
    prisma.checkResult.findMany({
      where: {
        checkId: { in: checkIds },
        timestamp: { gte: oneDayAgo }
      }
    }),
    prisma.checkResult.findMany({
      where: {
        checkId: { in: checkIds },
        timestamp: { gte: sevenDaysAgo }
      }
    }),
    prisma.checkResult.findMany({
      where: {
        checkId: { in: checkIds },
        timestamp: { gte: thirtyDaysAgo }
      }
    })
  ])

  const calculateUptime = (results: any[]) => {
    if (results.length === 0) return 100
    const successCount = results.filter(r => r.success).length
    return Math.round((successCount / results.length) * 10000) / 100
  }

  const uptimePercent24h = calculateUptime(results24h)
  const uptimePercent7d = calculateUptime(results7d)
  const uptimePercent30d = calculateUptime(results30d)

  // Determine current status
  let currentStatus: 'operational' | 'degraded' | 'outage' = 'operational'
  if (uptimePercent24h < 99.5) {
    currentStatus = uptimePercent24h < 95 ? 'outage' : 'degraded'
  }

  // Get last check time
  const lastResults = service.checks.flatMap(check => check.results)
  const lastCheck = lastResults.length > 0 ? lastResults[0].timestamp : undefined

  // Calculate average response time
  const recentResults = results24h.filter(r => r.success && r.responseTime)
  const averageResponseTime = recentResults.length > 0
    ? recentResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) / recentResults.length
    : undefined

  return {
    ...service,
    uptimePercent24h,
    uptimePercent7d,
    uptimePercent30d,
    currentStatus,
    lastCheck,
    averageResponseTime
  }
}

export async function getStatusOverview() {
  const [services, activeIncidents] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      include: {
        machine: true,
        checks: {
          where: { isActive: true }
        }
      }
    }),
    prisma.incident.findMany({
      where: {
        status: {
          in: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING']
        }
      },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' }
        },
        service: true,
        machine: true,
        creator: true
      }
    })
  ])

  const servicesWithStats = await Promise.all(
    services.map(async (service) => {
      const stats = await getServiceWithStats(service.id)
      return stats!
    })
  )

  // Calculate overall status
  const avgUptime24h = servicesWithStats.reduce((sum, s) => sum + s.uptimePercent24h, 0) / servicesWithStats.length
  let overall: 'operational' | 'degraded' | 'outage' = 'operational'
  
  if (activeIncidents.some(i => i.severity === 'CRITICAL')) {
    overall = 'outage'
  } else if (avgUptime24h < 99.5 || activeIncidents.length > 0) {
    overall = 'degraded'
  }

  const uptimeStats = {
    '24h': Math.round(avgUptime24h * 100) / 100,
    '7d': Math.round(servicesWithStats.reduce((sum, s) => sum + s.uptimePercent7d, 0) / servicesWithStats.length * 100) / 100,
    '30d': Math.round(servicesWithStats.reduce((sum, s) => sum + s.uptimePercent30d, 0) / servicesWithStats.length * 100) / 100
  }

  return {
    overall,
    services: servicesWithStats,
    activeIncidents,
    uptimeStats,
    lastUpdated: new Date()
  }
}

export async function getUptimeHistory(serviceId: string, days: number = 30) {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      checks: {
        where: { isActive: true }
      }
    }
  })

  if (!service) return []

  const checkIds = service.checks.map(check => check.id)

  const results = await prisma.checkResult.findMany({
    where: {
      checkId: { in: checkIds },
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { timestamp: 'asc' }
  })

  // Group results by day
  const dailyData = new Map()
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0]
    dailyData.set(dateKey, {
      date: dateKey,
      total: 0,
      successful: 0,
      incidents: []
    })
  }

  results.forEach(result => {
    const dateKey = result.timestamp.toISOString().split('T')[0]
    const dayData = dailyData.get(dateKey)
    if (dayData) {
      dayData.total++
      if (result.success) dayData.successful++
    }
  })

  // Get incidents for the period
  const incidents = await prisma.incident.findMany({
    where: {
      serviceId,
      startTime: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  // Add incidents to daily data
  incidents.forEach(incident => {
    const dateKey = incident.startTime.toISOString().split('T')[0]
    const dayData = dailyData.get(dateKey)
    if (dayData) {
      dayData.incidents.push({
        id: incident.id,
        title: incident.title,
        status: incident.status,
        severity: incident.severity,
        startTime: incident.startTime,
        endTime: incident.endTime
      })
    }
  })

  return Array.from(dailyData.values()).map(day => ({
    ...day,
    uptime: day.total > 0 ? Math.round((day.successful / day.total) * 10000) / 100 : 100
  }))
}

export async function getDashboardStats() {
  const [
    totalServices,
    totalChecks,
    activeIncidents,
    checksLast24h,
    failedChecksLast24h
  ] = await Promise.all([
    prisma.service.count({ where: { isActive: true } }),
    prisma.check.count({ where: { isActive: true } }),
    prisma.incident.count({
      where: {
        status: { in: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING'] }
      }
    }),
    prisma.checkResult.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.checkResult.count({
      where: {
        success: false,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  ])

  // Calculate average uptime
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: {
      checks: {
        where: { isActive: true }
      }
    }
  })

  const servicesWithStats = await Promise.all(
    services.map(service => getServiceWithStats(service.id))
  )

  const averageUptime = servicesWithStats.reduce(
    (sum, service) => sum + (service?.uptimePercent24h || 0), 
    0
  ) / servicesWithStats.length

  // Calculate P95 response time
  const responseTimeResults = await prisma.checkResult.findMany({
    where: {
      success: true,
      responseTime: { not: null },
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    },
    select: { responseTime: true },
    orderBy: { responseTime: 'asc' }
  })

  const responseTimeP95 = responseTimeResults.length > 0
    ? responseTimeResults[Math.floor(responseTimeResults.length * 0.95)]?.responseTime || 0
    : 0

  // Calculate MTTR (Mean Time To Recovery)
  const resolvedIncidents = await prisma.incident.findMany({
    where: {
      status: 'RESOLVED',
      endTime: { not: null },
      startTime: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  })

  const mttr = resolvedIncidents.length > 0
    ? resolvedIncidents.reduce((sum, incident) => {
        const duration = incident.endTime!.getTime() - incident.startTime.getTime()
        return sum + duration
      }, 0) / resolvedIncidents.length / 1000 / 60 // Convert to minutes
    : 0

  return {
    totalServices,
    totalChecks,
    activeIncidents,
    averageUptime: Math.round(averageUptime * 100) / 100,
    checksLast24h,
    failedChecksLast24h,
    responseTimeP95,
    mttr: Math.round(mttr)
  }
}