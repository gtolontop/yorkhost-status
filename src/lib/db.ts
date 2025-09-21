import { PrismaClient } from '@prisma/client'
import { UptimeData } from '@/types'

declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma = globalThis.__prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

/**
 * Get uptime history for a service
 */
export async function getUptimeHistory(serviceId: string, days: number = 30): Promise<UptimeData[]> {
  const startDate = new Date()
  startDate.setUTCDate(startDate.getUTCDate() - days)
  startDate.setUTCHours(0, 0, 0, 0)

  const checkResults = await prisma.checkResult.findMany({
    where: {
      check: {
        serviceId: serviceId
      },
      timestamp: {
        gte: startDate
      }
    },
    include: {
      check: {
        include: {
          service: true
        }
      }
    },
    orderBy: {
      timestamp: 'asc'
    }
  })

  // Group results by day
  const dailyData: { [key: string]: { total: number; successful: number } } = {}
  
  checkResults.forEach(result => {
    const dateKey = result.timestamp.toISOString().split('T')[0]
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { total: 0, successful: 0 }
    }
    
    dailyData[dateKey].total++
    if (result.success) {
      dailyData[dateKey].successful++
    }
  })
  
  // Get all incidents for the period in one query
  const periodStart = new Date()
  periodStart.setUTCDate(periodStart.getUTCDate() - days)
  periodStart.setUTCHours(0, 0, 0, 0)
  
  const allIncidents = await prisma.incident.findMany({
    where: {
      serviceId: serviceId,
      startTime: {
        gte: periodStart
      }
    },
    select: {
      id: true,
      title: true,
      status: true,
      severity: true,
      startTime: true,
      endTime: true
    }
  })
  
  // Group incidents by date
  const incidentsByDate: { [key: string]: any[] } = {}
  allIncidents.forEach(incident => {
    const dateKey = incident.startTime.toISOString().split('T')[0]
    if (!incidentsByDate[dateKey]) {
      incidentsByDate[dateKey] = []
    }
    incidentsByDate[dateKey].push({
      ...incident,
      endTime: incident.endTime || undefined
    })
  })

  // Convert to UptimeData array
  const uptimeData: UptimeData[] = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - (days - 1 - i))
    date.setUTCHours(0, 0, 0, 0) // Reset time to start of day in UTC
    const dateKey = date.toISOString().split('T')[0]
    
    const dayData = dailyData[dateKey]
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    
    // Si on a des données pour ce jour, calculer l'uptime
    let uptime = null
    if (dayData && dayData.total > 0) {
      uptime = (dayData.successful / dayData.total) * 100
    }
    
    uptimeData.push({
      date: dateKey,
      uptime: uptime !== null ? Math.round(uptime * 100) / 100 : null as any,
      incidents: incidentsByDate[dateKey] || []
    })
  }

  return uptimeData
}

/**
 * Get service stats
 */
export async function getServiceStats(serviceId: string) {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Get check results for different periods
  const [results24h, results7d, results30d, latestResult] = await Promise.all([
    prisma.checkResult.findMany({
      where: {
        check: { serviceId },
        timestamp: { gte: yesterday }
      },
      orderBy: { timestamp: 'asc' }
    }),
    prisma.checkResult.findMany({
      where: {
        check: { serviceId },
        timestamp: { gte: lastWeek }
      },
      orderBy: { timestamp: 'asc' }
    }),
    prisma.checkResult.findMany({
      where: {
        check: { serviceId },
        timestamp: { gte: lastMonth }
      },
      orderBy: { timestamp: 'asc' }
    }),
    prisma.checkResult.findFirst({
      where: {
        check: { serviceId }
      },
      orderBy: { timestamp: 'desc' }
    })
  ])

  const calculateUptime = (results: any[]) => {
    if (results.length === 0) return 0 // No data = 0% uptime
    const successful = results.filter(r => r.success).length
    return (successful / results.length) * 100
  }

  const getCurrentStatus = (results: any[]) => {
    if (results.length === 0) return 'unknown'
    
    // Get the most recent result
    const lastResult = results[results.length - 1]
    
    // If the last check failed, it's an outage
    if (!lastResult.success) return 'outage'
    
    // Check last few results for degraded performance
    const recentResults = results.slice(-5)
    const successRate = recentResults.filter(r => r.success).length / recentResults.length
    
    if (successRate === 1) return 'operational'
    if (successRate >= 0.8) return 'degraded'
    return 'outage'
  }

  const getAverageResponseTime = (results: any[]) => {
    if (results.length === 0) return 0
    const validResults = results.filter(r => r.responseTime && r.success)
    if (validResults.length === 0) return 0
    
    const sum = validResults.reduce((acc, r) => acc + r.responseTime, 0)
    return sum / validResults.length
  }

  return {
    uptimePercent24h: calculateUptime(results24h),
    uptimePercent7d: calculateUptime(results7d),
    uptimePercent30d: calculateUptime(results30d),
    currentStatus: getCurrentStatus(results24h),
    lastCheck: latestResult?.timestamp,
    averageResponseTime: getAverageResponseTime(results24h)
  }
}

/**
 * Get overall status overview
 */
export async function getStatusOverview() {
  const [services, activeIncidents] = await Promise.all([
    prisma.service.findMany({
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
    }),
    prisma.incident.findMany({
      where: {
        OR: [
          {
            // Active incidents
            type: 'INCIDENT',
            status: {
              in: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING']
            }
          },
          {
            // Scheduled maintenances
            type: 'MAINTENANCE',
            status: 'SCHEDULED',
            scheduledFor: {
              lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
            }
          },
          {
            // Ongoing maintenances
            type: 'MAINTENANCE',
            status: 'IN_PROGRESS'
          }
        ]
      },
      include: {
        updates: {
          orderBy: { timestamp: 'desc' }
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
      }
    })
  ])

  // Calculate service stats
  const servicesWithStats = await Promise.all(
    services.map(async (service) => {
      const stats = await getServiceStats(service.id)
      return {
        ...service,
        ...stats
      }
    })
  )

  // Calculate overall status
  const allUptimes = servicesWithStats.map(s => s.uptimePercent24h)
  const averageUptime = allUptimes.length > 0 
    ? allUptimes.reduce((sum, uptime) => sum + uptime, 0) / allUptimes.length 
    : 100

  let overallStatus: 'operational' | 'degraded' | 'outage' | 'maintenance' = 'operational'
  
  // Check if any service has an outage
  const hasOutage = servicesWithStats.some(s => s.currentStatus === 'outage')
  const hasDegraded = servicesWithStats.some(s => s.currentStatus === 'degraded')
  const hasActiveMaintenance = activeIncidents.some(i => i.type === 'MAINTENANCE' && i.status === 'IN_PROGRESS')
  const hasActiveIncidents = activeIncidents.some(i => i.type === 'INCIDENT')
  
  if (hasActiveMaintenance && !hasOutage && !hasActiveIncidents) {
    overallStatus = 'maintenance' as any
  } else if (hasOutage || activeIncidents.some(i => i.severity === 'CRITICAL')) {
    overallStatus = 'outage'
  } else if (hasDegraded || hasActiveIncidents || averageUptime < 99) {
    overallStatus = 'degraded'
  }

  // Calculate uptime stats
  const uptimeStats = {
    '24h': Math.round(averageUptime * 100) / 100,
    '7d': Math.round(servicesWithStats.reduce((sum, s) => sum + s.uptimePercent7d, 0) / servicesWithStats.length * 100) / 100 || 100,
    '30d': Math.round(servicesWithStats.reduce((sum, s) => sum + s.uptimePercent30d, 0) / servicesWithStats.length * 100) / 100 || 100
  }

  return {
    overall: overallStatus,
    services: servicesWithStats,
    activeIncidents,
    uptimeStats,
    lastUpdated: new Date()
  }
}

/**
 * Get dashboard statistics for admin panel
 */
export async function getDashboardStats() {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    totalServices,
    totalChecks,
    activeIncidents,
    checksLast24h,
    failedChecksLast24h,
    allServices
  ] = await Promise.all([
    prisma.service.count(),
    prisma.check.count(),
    prisma.incident.count({
      where: {
        status: {
          in: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING']
        }
      }
    }),
    prisma.checkResult.count({
      where: {
        timestamp: { gte: yesterday }
      }
    }),
    prisma.checkResult.count({
      where: {
        timestamp: { gte: yesterday },
        success: false
      }
    }),
    prisma.service.findMany({
      include: {
        checks: {
          include: {
            results: {
              where: {
                timestamp: { gte: yesterday }
              }
            }
          }
        }
      }
    })
  ])

  // Calculate average uptime
  let totalUptime = 0
  let serviceCount = 0

  for (const service of allServices) {
    const stats = await getServiceStats(service.id)
    totalUptime += stats.uptimePercent24h
    serviceCount++
  }

  const averageUptime = serviceCount > 0 ? totalUptime / serviceCount : 100

  // Calculate response time P95
  const allResponseTimes = await prisma.checkResult.findMany({
    where: {
      timestamp: { gte: yesterday },
      success: true,
      responseTime: { not: null }
    },
    select: {
      responseTime: true
    },
    orderBy: {
      responseTime: 'asc'
    }
  })

  const responseTimeP95 = allResponseTimes.length > 0
    ? allResponseTimes[Math.floor(allResponseTimes.length * 0.95)]?.responseTime || 0
    : 0

  // Calculate MTTR (Mean Time To Recovery)
  const resolvedIncidents = await prisma.incident.findMany({
    where: {
      status: 'RESOLVED',
      endTime: { not: null },
      startTime: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    },
    select: {
      startTime: true,
      endTime: true
    }
  })

  let totalRecoveryTime = 0
  resolvedIncidents.forEach(incident => {
    if (incident.endTime) {
      totalRecoveryTime += incident.endTime.getTime() - incident.startTime.getTime()
    }
  })

  const mttr = resolvedIncidents.length > 0
    ? totalRecoveryTime / resolvedIncidents.length / (1000 * 60) // Convert to minutes
    : 0

  return {
    totalServices,
    totalChecks,
    activeIncidents,
    averageUptime: Math.round(averageUptime * 100) / 100,
    checksLast24h,
    failedChecksLast24h,
    responseTimeP95: Math.round(responseTimeP95),
    mttr: Math.round(mttr)
  }
}